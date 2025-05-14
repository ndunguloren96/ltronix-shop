# /payment/views.py

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django_daraja.mpesa.core import MpesaClient
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from .models import Transaction
from django.conf import settings
import logging
import json
from store.models import Order

# Initialize logger
logger = logging.getLogger(__name__)


class STKPushView(View):
    """
    Handles M-Pesa STK Push requests.
    """

    def post(self, request):
        phone = request.POST.get('phone')  # Use .get() to avoid KeyError if phone is missing
        amount = request.POST.get('amount') # Use .get() to avoid KeyError if amount is missing
        order_id = request.POST.get('order_id')

        if not phone or not amount:
            return JsonResponse({'error': 'Phone and amount are required'}, status=400)

        try:
            amount = int(amount)   # Ensure amount is an integer
            if amount <= 0:
                return JsonResponse({'error': 'Amount must be greater than zero'}, status=400)
        except ValueError:
            return JsonResponse({'error': 'Invalid amount'}, status=400)

        # Get the order
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found'}, status=400)

        # record initial transaction
        tx = Transaction.objects.create(phone=phone, amount=amount, order=order) # tying payment and order

        client = MpesaClient()
        account_reference = 'LtronixShop'   # Use a consistent account reference
        transaction_desc = 'Order payment'
        callback_url = settings.MPESA_CALLBACK_URL   # Use the callback URL from settings

        try:
            response = client.stk_push(
                phone_number=phone,
                amount=amount,
                account_reference=account_reference,
                transaction_desc=transaction_desc,
                callback_url=callback_url
            )

            logger.info(f"STK Push Response: {response}")   # Log the response

            # save IDs for callback matching
            if response and 'MerchantRequestID' in response and 'CheckoutRequestID' in response:
                tx.merchant_request_id = response['MerchantRequestID']
                tx.checkout_request_id = response['CheckoutRequestID']
                tx.save()
                if response['ResponseCode'] == '0':
                    return render(request, 'payment_success.html', {'transaction': tx})
                else:
                    return render(request, 'payment_error.html', {'error': response.get('errorMessage', 'M-Pesa error')})
            else:
                # Handle the case where the STK push request failed.  Include logging.
                error_message = response.get('errorMessage', 'Failed to initiate STK push') #safely get the error message
                logger.error(f"STK Push Failed: {error_message}")
                tx.status = 'FAILED'   # Set the transaction status to FAILED
                tx.save()
                return render(request, 'payment_error.html', {'error': error_message}) # Redirect to error template

        except Exception as e:
            # Catch any exceptions during the STK push process.  Crucial for error handling.
            logger.exception(f"Error during STK Push: {e}")
            tx.status = 'ERROR'
            tx.save()
            return JsonResponse({'error': f'An error occurred: {e}'}, status=500)   # Return 500 for server error


@csrf_exempt   #  Disable CSRF for this view as it's called by M-Pesa
def mpesa_stk_push_callback(request):
    """
    This view will receive the M-Pesa STK Push callback.  It's crucial for updating the transaction status.
    """
    logger.info("M-Pesa STK Push Callback received!") #log
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Callback Data: {callback_data}") # Log the entire callback

        if 'Body' in callback_data and 'stkCallback' in callback_data['Body']:
            stk_callback = callback_data['Body']['stkCallback']
            result_code = stk_callback.get('ResultCode')
            merchant_request_id = stk_callback.get('MerchantRequestID')

            if result_code == 0:
                # Transaction successful
                result_desc = stk_callback.get('ResultDesc', 'Transaction successful')
                logger.info(f"Transaction successful: {result_desc}, MerchantRequestID: {merchant_request_id}")
                try:
                    transaction = Transaction.objects.get(merchant_request_id=merchant_request_id)
                    transaction.status = 'COMPLETED'
                    transaction.save()
                    if transaction.order: #check if the transaction has an order
                        transaction.order.complete = True
                        transaction.order.save()
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}")
                    # Consider creating a new Transaction record here if appropriate for your business logic
                except Exception as e:
                    logger.exception(f"Error updating transaction: {e}")

            else:
                # Transaction failed
                result_desc = stk_callback.get('ResultDesc', 'Transaction failed')   # Provide a default
                logger.warning(f"Transaction failed: {result_desc}, ResultCode: {result_code}, MerchantRequestID: {merchant_request_id}")
                try:
                    transaction = Transaction.objects.get(merchant_request_id=merchant_request_id)
                    transaction.status = 'FAILED'
                    transaction.save()
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}")
                    # Consider creating a new Transaction record here if appropriate for your business logic
                except Exception as e:
                    logger.exception(f"Error updating transaction: {e}")
        else:
            logger.error("Invalid callback data format. Missing 'Body' or 'stkCallback'.")
            return HttpResponse('Invalid callback data', status=400)

    except json.JSONDecodeError:
        logger.error("Error decoding JSON from M-Pesa callback.")
        return HttpResponse('Invalid JSON', status=400)   #  Return a 400 for bad request

    except Exception as e:
        # Catch any other unexpected errors
        logger.exception(f"Unexpected error in mpesa_stk_push_callback: {e}")
        return HttpResponse('Internal server error', status=500)   # Return 500 for server error

    return HttpResponse('OK')   #  Always return 200 OK to M-Pesa to acknowledge receipt