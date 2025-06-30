# ecommerce/payment/api_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes # Import for function-based views if needed

from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import transaction as db_transaction # Use alias to avoid conflict with model field
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from django_daraja.mpesa.core import MpesaClient # M-Pesa API client
import json
import logging

from .models import Transaction # Import the updated Transaction model
from .serializers import TransactionSerializer # Import the new TransactionSerializer
from store.models import Order # Ensure Order model is imported

logger = logging.getLogger(__name__)

# --- STK Push Initiation API View ---
class MpesaStkPushAPIView(APIView):
    """
    API endpoint to initiate an M-Pesa STK Push.
    Requires phone number and order_id in the request body.
    """
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can initiate payments for now

    def post(self, request):
        phone_number = request.data.get('phone_number') # Use phone_number for consistency
        order_id = request.data.get('order_id')

        if not phone_number or not order_id:
            return Response(
                {'detail': 'Phone number and order ID are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Phone number validation: Ensure it's a valid Safaricom number format (e.g., 2547...)
        # You might want to add more robust regex validation here
        if not phone_number.startswith('254') or len(phone_number) != 12:
            return Response(
                {'detail': 'Invalid phone number format. Must start with 254 and be 12 digits (e.g., 2547XXXXXXXX).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Ensure the order exists and belongs to the authenticated user if applicable
            order = get_object_or_404(Order, id=order_id, complete=False)
            
            # If the order has a customer, ensure it's the current user's order
            if order.customer and order.customer.user != request.user:
                return Response({'detail': 'You do not have permission to checkout this order.'}, status=status.HTTP_403_FORBIDDEN)
            
            # If it's a guest order, ensure it's linked to the session
            # (assuming frontend sends session_key for guest orders in a header, not needed for this endpoint as it's IsAuthenticated)
            # This logic might need to be refined if you allow unauthenticated users to initiate payments after getting a cart ID
            # For now, let's stick to IsAuthenticated for STK Push.

        except Order.DoesNotExist:
            return Response({'detail': 'Active order not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Convert amount to integer (M-Pesa expects integer, usually in KES cents or full KES depending on API, django-daraja uses full KES)
        # It's crucial to send the correct amount format to M-Pesa.
        amount_to_pay = int(order.get_cart_total) 
        
        if amount_to_pay <= 0:
            return Response({'detail': 'Order amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for existing PENDING transaction for this order to prevent duplicates
        existing_transaction = Transaction.objects.filter(order=order, status='PENDING').first()
        if existing_transaction:
            logger.info(f"Existing PENDING transaction found for order {order_id}. Returning its details.")
            serializer = TransactionSerializer(existing_transaction)
            return Response(serializer.data, status=status.HTTP_200_OK)

        try:
            with db_transaction.atomic():
                # Create a new Transaction instance in PENDING state
                tx = Transaction.objects.create(
                    order=order,
                    phone=phone_number,
                    amount=amount_to_pay,
                    status='PENDING'
                )
                
                client = MpesaClient()
                account_reference = f'Ltronix_{order.id}' # Unique reference for the transaction
                transaction_desc = f'Payment for Order {order.id}'
                callback_url = settings.MPESA_CALLBACK_URL # Loaded from settings.py

                logger.info(f"Initiating STK Push for Order {order.id} | Phone: {phone_number} | Amount: {amount_to_pay} | Callback: {callback_url}")
                
                response_data = client.stk_push(
                    phone_number=phone_number,
                    amount=amount_to_pay,
                    account_reference=account_reference,
                    transaction_desc=transaction_desc,
                    callback_url=callback_url
                )
                
                # Check if the STK push initiation was successful (from Daraja API perspective)
                if response_data.get('ResponseCode') == '0': # '0' typically means successful request to Daraja
                    tx.merchant_request_id = response_data.get('MerchantRequestID')
                    tx.checkout_request_id = response_data.get('CheckoutRequestID')
                    tx.result_desc = response_data.get('CustomerMessage', response_data.get('ResponseDescription', 'STK Push initiated successfully.'))
                    tx.save()
                    logger.info(f"STK Push initiated successfully for TXN {tx.id}. MerchantRequestID: {tx.merchant_request_id}")
                    serializer = TransactionSerializer(tx)
                    return Response(serializer.data, status=status.HTTP_200_OK) # Return 200 OK for successful initiation
                else:
                    # Daraja API returned an error for the STK push request itself
                    error_message = response_data.get('CustomerMessage', response_data.get('ResponseDescription', 'STK Push initiation failed at Daraja API.'))
                    logger.error(f"STK Push initiation failed for TXN {tx.id}: {error_message}")
                    tx.status = 'FAILED'
                    tx.result_desc = error_message
                    tx.result_code = response_data.get('ResponseCode', 'UNKNOWN')
                    tx.save()
                    return Response({'detail': error_message}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f"Unexpected error during STK Push initiation for order {order_id}: {e}")
            # If transaction object was created, mark it as failed
            if 'tx' in locals() and tx.status == 'PENDING':
                tx.status = 'FAILED'
                tx.result_desc = str(e) # Store exception message
                tx.save()
            return Response({'detail': 'An unexpected error occurred during payment initiation. Please try again.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- M-Pesa Confirmation Callback API View ---
@method_decorator(csrf_exempt, name='dispatch') # Disable CSRF for this webhook endpoint
class MpesaConfirmationAPIView(APIView):
    """
    API endpoint to receive M-Pesa STK Push confirmation callbacks.
    This endpoint is called by Safaricom.
    It updates the Transaction status based on the callback data.
    """
    permission_classes = [permissions.AllowAny] # Must be AllowAny for M-Pesa to call it

    def post(self, request):
        logger.info("M-Pesa STK Push Callback received.")
        try:
            # Safaricom sends JSON directly in the body
            callback_data = json.loads(request.body.decode('utf-8'))
            logger.info(f"Callback Raw Body: {request.body.decode('utf-8')}")
            logger.info(f"Callback Data: {callback_data}")

            if 'Body' not in callback_data or 'stkCallback' not in callback_data['Body']:
                logger.warning("Invalid M-Pesa callback format: Missing 'Body' or 'stkCallback'.")
                return Response({'detail': 'Invalid callback format.'}, status=status.HTTP_400_BAD_REQUEST)

            stk_callback = callback_data['Body']['stkCallback']
            merchant_request_id = stk_callback.get('MerchantRequestID')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            mpesa_receipt_number = None

            # Extract MpesaReceiptNumber if payment was successful
            if result_code == 0 and 'CallbackMetadata' in stk_callback and 'Item' in stk_callback['CallbackMetadata']:
                for item in stk_callback['CallbackMetadata']['Item']:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        mpesa_receipt_number = item.get('Value')
                        break

            if not merchant_request_id:
                logger.error("M-Pesa callback missing MerchantRequestID.")
                return Response({'detail': 'Callback missing MerchantRequestID.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                # Find the corresponding transaction
                transaction = get_object_or_404(Transaction, merchant_request_id=merchant_request_id)

                if transaction.is_callback_received:
                    logger.warning(f"Duplicate callback received for MerchantRequestID: {merchant_request_id}. Transaction already processed.")
                    return Response({'detail': 'Callback already processed.'}, status=status.HTTP_200_OK) # Return OK for idempotency

                if result_code == 0: # Payment successful
                    transaction.mark_completed(
                        mpesa_receipt=mpesa_receipt_number,
                        result_code=result_code,
                        result_desc=result_desc
                    )
                    logger.info(f"Transaction {transaction.id} COMPLETED. Receipt: {mpesa_receipt_number}")
                else: # Payment failed or cancelled
                    if result_code == 1032: # User cancelled
                        transaction.mark_cancelled(result_code=result_code, result_desc=result_desc)
                        logger.info(f"Transaction {transaction.id} CANCELLED by user. ResultCode: {result_code}")
                    else: # Other failures/timeouts
                        transaction.mark_failed(result_code=result_code, result_desc=result_desc)
                        logger.error(f"Transaction {transaction.id} FAILED. ResultCode: {result_code} - {result_desc}")
                
                # Mark callback as received to prevent duplicate processing
                transaction.is_callback_received = True
                transaction.save()

            except Transaction.DoesNotExist:
                logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}. Cannot process callback.")
                return Response({'detail': 'Transaction not found for callback.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.exception(f"Error processing M-Pesa callback for MerchantRequestID {merchant_request_id}: {e}")
                return Response({'detail': 'Internal server error during callback processing.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except json.JSONDecodeError:
            logger.error("M-Pesa callback received invalid JSON.")
            return Response({'detail': 'Invalid JSON format in request body.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Unexpected error in MpesaConfirmationAPIView: {e}")
            return Response({'detail': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'detail': 'Callback processed successfully.'}, status=status.HTTP_200_OK)


# --- Transaction Status Check API View ---
class MpesaPaymentStatusAPIView(APIView):
    """
    API endpoint to check the status of an M-Pesa transaction.
    Requires 'transaction_id' or 'checkout_request_id' as a query parameter.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Allow guest to check their own transaction status

    def get(self, request):
        transaction_id = request.query_params.get('transaction_id')
        checkout_request_id = request.query_params.get('checkout_request_id')

        if not transaction_id and not checkout_request_id:
            return Response(
                {'detail': 'Either transaction_id or checkout_request_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if transaction_id:
                transaction = get_object_or_404(Transaction, id=transaction_id)
            elif checkout_request_id:
                transaction = get_object_or_404(Transaction, checkout_request_id=checkout_request_id)
            
            # Permission check: if authenticated, ensure they own this transaction/order
            if request.user.is_authenticated and transaction.order and transaction.order.customer and transaction.order.customer.user != request.user:
                return Response({'detail': 'You do not have permission to view this transaction.'}, status=status.HTTP_403_FORBIDDEN)
            
            # If unauthenticated, and checking by checkout_request_id (likely for polling), it's allowed.
            # We don't have session_key on Transaction model directly, it's on Order.
            # For simplicity for guest polling, we'll rely on `AllowAny` for this read-only endpoint,
            # but in a production system, you might want to enforce that the `checkout_request_id` 
            # returned by initial STK push is tied to a session or temporary user for guests.

            serializer = TransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Transaction.DoesNotExist:
            return Response({'detail': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error checking payment status: {e}")
            return Response({'detail': 'An unexpected error occurred while checking status.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

