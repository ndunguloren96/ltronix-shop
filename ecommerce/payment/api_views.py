# ecommerce/payment/api_views.py
import json
import logging

from django.conf import settings
from django.db import transaction as db_transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django_daraja.mpesa.core import MpesaClient
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from store.models import Order, Customer # Import Customer model
from emails.services import send_payment_receipt

from .models import Transaction
from .serializers import TransactionSerializer

logger = logging.getLogger(__name__)


class MpesaStkPushAPIView(APIView):
    """API view for initiating an M-Pesa STK push."""
    # Allow unauthenticated users for guest checkout, but also authenticated users
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Handles the POST request to initiate an M-Pesa STK push."""
        phone_number = request.data.get("phone_number")
        order_id = request.data.get("order_id")
        guest_session_key = request.headers.get("X-Session-Key") # Get session key from headers

        if not phone_number or not order_id:
            return Response(
                {"detail": "Phone number and order ID are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not phone_number.startswith("254") or len(phone_number) != 12:
            return Response(
                {
                    "detail": "Invalid phone number format. Must start with 254 and be 12 digits (e.g., 2547XXXXXXXX)."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Determine how to fetch the order based on authentication status
            if request.user.is_authenticated:
                order = get_object_or_404(Order, id=order_id, customer__user=request.user, complete=False)
                logger.info(f"Authenticated user {request.user.email} initiating STK Push for order {order_id}")
            elif guest_session_key:
                # For guest users, associate the order with the session_key
                order = get_object_or_404(Order, id=order_id, session_key=guest_session_key, complete=False)
                logger.info(f"Guest user (session_key: {guest_session_key[:8]}...) initiating STK Push for order {order_id}")
            else:
                return Response(
                    {"detail": "Authentication required or missing guest session key."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            
            # Ensure the customer for the order exists and has an email for potential receipt sending
            if not order.customer:
                # This case should ideally not happen if cart creation ensures a customer (even an anonymous one)
                # is linked. However, as a safeguard, try to link an anonymous customer or return error.
                # For now, let's assume order.customer always exists.
                pass 

        except Order.DoesNotExist:
            return Response(
                {"detail": "Active order not found for this user/session."}, status=status.HTTP_404_NOT_FOUND
            )

        amount_to_pay = int(order.get_cart_total)

        if amount_to_pay <= 0:
            return Response(
                {"detail": "Order amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for existing PENDING transaction for this order
        existing_transaction = Transaction.objects.filter(
            order=order, status="PENDING"
        ).first()
        if existing_transaction:
            logger.info(
                f"Existing PENDING transaction found for order {order_id}. Returning its details."
            )
            serializer = TransactionSerializer(existing_transaction)
            return Response(serializer.data, status=status.HTTP_200_OK)

        try:
            with db_transaction.atomic():
                tx = Transaction.objects.create(
                    order=order,
                    phone=phone_number,
                    amount=amount_to_pay,
                    status="PENDING",
                )
                client = MpesaClient()
                account_reference = f"Ltronix_{order.id}"
                transaction_desc = f"Payment for Order {order.id}"
                callback_url = settings.MPESA_CALLBACK_URL

                logger.info(
                    f"Initiating STK Push for Order {order.id} | Phone: {phone_number} | Amount: {amount_to_pay} | Callback: {callback_url}"
                )

                response_data = client.stk_push(
                    phone_number=phone_number,
                    amount=amount_to_pay,
                    account_reference=account_reference,
                    transaction_desc=transaction_desc,
                    callback_url=callback_url,
                )

                if response_data.get("ResponseCode") == "0":
                    tx.merchant_request_id = response_data.get("MerchantRequestID")
                    tx.checkout_request_id = response_data.get("CheckoutRequestID")
                    tx.result_desc = response_data.get(
                        "CustomerMessage",
                        response_data.get(
                            "ResponseDescription", "STK Push initiated successfully."
                        ),
                    )
                    tx.save()
                    logger.info(
                        f"STK Push initiated successfully for TXN {tx.id}. MerchantRequestID: {tx.merchant_request_id}"
                    )
                    serializer = TransactionSerializer(tx)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    error_message = response_data.get(
                        "CustomerMessage",
                        response_data.get(
                            "ResponseDescription",
                            "STK Push initiation failed at Daraja API.",
                        ),
                    )
                    logger.error(
                        f"STK Push initiation failed for TXN {tx.id}: {error_message}"
                    )
                    tx.status = "FAILED"
                    tx.result_desc = error_message
                    tx.result_code = response_data.get("ResponseCode", "UNKNOWN")
                    tx.save()
                    return Response(
                        {"detail": error_message}, status=status.HTTP_400_BAD_REQUEST
                    )

        except Exception as e:
            logger.exception(
                f"Unexpected error during STK Push initiation for order {order_id}: {e}"
            )
            if "tx" in locals() and tx.status == "PENDING":
                tx.status = "FAILED"
                tx.result_desc = str(e)
                tx.save()
            return Response(
                {
                    "detail": "An unexpected error occurred during payment initiation. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class MpesaConfirmationAPIView(APIView):
    """API view for handling the M-Pesa confirmation callback."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Handles the POST request from M-Pesa."""
        logger.info("M-Pesa STK Push Callback received.")
        try:
            callback_data = json.loads(request.body.decode("utf-8"))
            logger.info(f"Callback Raw Body: {request.body.decode('utf-8')}")
            logger.info(f"Callback Data: {callback_data}")

            if (
                "Body" not in callback_data
                or "stkCallback" not in callback_data["Body"]
            ):
                logger.warning(
                    "Invalid M-Pesa callback format: Missing 'Body' or 'stkCallback'."
                )
                return Response(
                    {"detail": "Invalid callback format."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            stk_callback = callback_data["Body"]["stkCallback"]
            merchant_request_id = stk_callback.get("MerchantRequestID")
            checkout_request_id = stk_callback.get("CheckoutRequestID")
            result_code = stk_callback.get("ResultCode")
            result_desc = stk_callback.get("ResultDesc")
            mpesa_receipt_number = None

            if (
                result_code == 0
                and "CallbackMetadata" in stk_callback
                and "Item" in stk_callback["CallbackMetadata"]
            ):
                for item in stk_callback["CallbackMetadata"]["Item"]:
                    if item.get("Name") == "MpesaReceiptNumber":
                        mpesa_receipt_number = item.get("Value")
                        break

            if not merchant_request_id:
                logger.error("M-Pesa callback missing MerchantRequestID.")
                return Response(
                    {"detail": "Callback missing MerchantRequestID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                # Use select_related to get the order and customer in one query for email sending
                transaction = get_object_or_404(
                    Transaction.objects.select_related('order__customer__user'),
                    merchant_request_id=merchant_request_id
                )

                if transaction.is_callback_received:
                    logger.warning(
                        f"Duplicate callback received for MerchantRequestID: {merchant_request_id}. Transaction already processed."
                    )
                    return Response(
                        {"detail": "Callback already processed."},
                        status=status.HTTP_200_OK,
                    )

                if result_code == 0:
                    transaction.mark_completed(
                        mpesa_receipt=mpesa_receipt_number,
                        result_code=result_code,
                        result_desc=result_desc,
                    )
                    logger.info(
                        f"Transaction {transaction.id} COMPLETED. Receipt: {mpesa_receipt_number}"
                    )
                    
                    # Send payment receipt email
                    recipient_email = None
                    if transaction.order and transaction.order.customer:
                        if transaction.order.customer.user:
                            recipient_email = transaction.order.customer.user.email
                        else: # Guest customer associated directly with email
                            recipient_email = transaction.order.customer.email

                    if recipient_email:
                        send_payment_receipt(recipient_email, {
                            'order_id': transaction.order.id, # Changed from 'id' to 'order_id' for clarity in template
                            'customer_name': transaction.order.customer.name if transaction.order.customer else 'Guest',
                            'amount_paid': str(transaction.amount), # Use transaction amount
                            'mpesa_receipt_number': mpesa_receipt_number,
                            'transaction_date': transaction.created_at.strftime("%Y-%m-%d %H:%M:%S"), # Format date
                            'items': [{
                                'product_name': item.product.name,
                                'quantity': item.quantity,
                                'get_total': str(item.get_total)
                            } for item in transaction.order.orderitem_set.all()]
                        })
                        logger.info(
                            f"Payment receipt email sent to {recipient_email} for order {transaction.order.id}"
                        )
                else:
                    if result_code == 1032:
                        transaction.mark_cancelled(
                            result_code=result_code, result_desc=result_desc
                        )
                        logger.info(
                            f"Transaction {transaction.id} CANCELLED by user. ResultCode: {result_code}"
                        )
                    else:
                        transaction.mark_failed(
                            result_code=result_code, result_desc=result_desc
                        )
                        logger.error(
                            f"Transaction {transaction.id} FAILED. ResultCode: {result_code} - {result_desc}"
                        )

                transaction.is_callback_received = True
                transaction.save()

            except Transaction.DoesNotExist:
                logger.error(
                    f"Transaction not found for MerchantRequestID: {merchant_request_id}. Cannot process callback."
                )
                return Response(
                    {"detail": "Transaction not found for callback."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            except Exception as e:
                logger.exception(
                    f"Error processing M-Pesa callback for MerchantRequestID {merchant_request_id}: {e}"
                )
                return Response(
                    {"detail": "Internal server error during callback processing."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except json.JSONDecodeError:
            logger.error("M-Pesa callback received invalid JSON.")
            return Response(
                {"detail": "Invalid JSON format in request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception(f"Unexpected error in MpesaConfirmationAPIView: {e}")
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Callback processed successfully."}, status=status.HTTP_200_OK
        )


class MpesaPaymentStatusAPIView(APIView):
    """API view for checking the status of an M-Pesa transaction."""
    # Allow unauthenticated users to check status by transaction ID or checkout request ID
    permission_classes = [permissions.AllowAny] 

    def get(self, request):
        """Handles the GET request to check the status of an M-Pesa transaction."""
        transaction_id = request.query_params.get("transaction_id")
        checkout_request_id = request.query_params.get("checkout_request_id")
        guest_session_key = request.headers.get("X-Session-Key")

        if not transaction_id and not checkout_request_id:
            return Response(
                {"detail": "Either transaction_id or checkout_request_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transaction_query = Transaction.objects.all()

            if transaction_id:
                transaction_query = transaction_query.filter(id=transaction_id)
            elif checkout_request_id:
                transaction_query = transaction_query.filter(checkout_request_id=checkout_request_id)
            
            transaction = get_object_or_404(transaction_query)

            # Permission check: ensure the user/session owns the transaction's order
            is_owner = False
            if request.user.is_authenticated and transaction.order and transaction.order.customer and transaction.order.customer.user == request.user:
                is_owner = True
            elif guest_session_key and transaction.order and transaction.order.session_key == guest_session_key:
                is_owner = True
            
            if not is_owner:
                return Response(
                    {"detail": "You do not have permission to view this transaction."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = TransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f"Error checking payment status: {e}")
            return Response(
                {"detail": "An unexpected error occurred while checking status."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )