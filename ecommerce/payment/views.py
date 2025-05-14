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

logger = logging.getLogger(__name__)

class STKPushView(View):
    """
    Handles M-Pesa STK Push requests.
    """

    def post(self, request):
        phone = request.POST.get('phone')
        order_id = request.POST.get('order_id')

        if not phone or not order_id:
            return JsonResponse({'error': 'Phone and order ID are required'}, status=400)

        # Get the order and amount from the database
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found'}, status=400)

        amount = int(order.get_cart_total)
        if amount <= 0:
            return JsonResponse({'error': 'Order amount must be greater than zero'}, status=400)

        # record initial transaction
        tx = Transaction.objects.create(phone=phone, amount=amount, order=order)

        client = MpesaClient()
        account_reference = 'LtronixShop'
        transaction_desc = 'Order payment'
        callback_url = settings.MPESA_CALLBACK_URL

        try:
            response = client.stk_push(
                phone_number=phone,
                amount=amount,
                account_reference=account_reference,
                transaction_desc=transaction_desc,
                callback_url=callback_url
            )

            logger.info(f"STK Push Response: {response}")

            # Convert response to dict if possible
            if hasattr(response, '__dict__'):
                response_data = vars(response)
            elif isinstance(response, dict):
                response_data = response
            else:
                response_data = {}

            # save IDs for callback matching
            if response_data and 'MerchantRequestID' in response_data and 'CheckoutRequestID' in response_data:
                tx.merchant_request_id = response_data['MerchantRequestID']
                tx.checkout_request_id = response_data['CheckoutRequestID']
                tx.save()
                if response_data.get('ResponseCode') == '0':
                    # Render only the inner content for AJAX
                    return render(request, 'store/payment_success.html', {'transaction': tx})
                else:
                    return render(request, 'store/payment_error.html', {'error': response_data.get('errorMessage', 'M-Pesa error')})
            else:
                error_message = response_data.get('errorMessage', 'Failed to initiate STK push')
                logger.error(f"STK Push Failed: {error_message}")
                tx.status = 'FAILED'
                tx.save()
                return render(request, 'store/payment_error.html', {'error': error_message})

        except Exception as e:
            logger.exception(f"Error during STK Push: {e}")
            tx.status = 'ERROR'
            tx.save()
            return JsonResponse({'error': f'An error occurred: {e}'}, status=500)

@csrf_exempt
def mpesa_stk_push_callback(request):
    logger.info("M-Pesa STK Push Callback received!")
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Callback Data: {callback_data}")

        if 'Body' in callback_data and 'stkCallback' in callback_data['Body']:
            stk_callback = callback_data['Body']['stkCallback']
            result_code = stk_callback.get('ResultCode')
            merchant_request_id = stk_callback.get('MerchantRequestID')

            if result_code == 0:
                result_desc = stk_callback.get('ResultDesc', 'Transaction successful')
                logger.info(f"Transaction successful: {result_desc}, MerchantRequestID: {merchant_request_id}")
                try:
                    transaction = Transaction.objects.get(merchant_request_id=merchant_request_id)
                    transaction.status = 'COMPLETED'
                    transaction.save()
                    if transaction.order:
                        transaction.order.complete = True
                        transaction.order.save()
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}")
                except Exception as e:
                    logger.exception(f"Error updating transaction: {e}")

            else:
                result_desc = stk_callback.get('ResultDesc', 'Transaction failed')
                logger.warning(f"Transaction failed: {result_desc}, ResultCode: {result_code}, MerchantRequestID: {merchant_request_id}")
                try:
                    transaction = Transaction.objects.get(merchant_request_id=merchant_request_id)
                    transaction.status = 'FAILED'
                    transaction.save()
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}")
                except Exception as e:
                    logger.exception(f"Error updating transaction: {e}")
        else:
            logger.error("Invalid callback data format. Missing 'Body' or 'stkCallback'.")
            return HttpResponse('Invalid callback data', status=400)

    except json.JSONDecodeError:
        logger.error("Error decoding JSON from M-Pesa callback.")
        return HttpResponse('Invalid JSON', status=400)

    except Exception as e:
        logger.exception(f"Unexpected error in mpesa_stk_push_callback: {e}")
        return HttpResponse('Internal server error', status=500)

    return HttpResponse('OK')