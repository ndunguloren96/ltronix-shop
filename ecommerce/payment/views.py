from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django_daraja.mpesa.core import MpesaClient
from .models import Transaction
from store.models import Order
import json
import logging

logger = logging.getLogger(__name__)

class STKPushView(View): # For M-PESA STK Push processing and initiation.
    def post(self, request):
        phone = request.POST.get('phone')
        order_id = request.POST.get('order_id')

        if not phone or not order_id:
            return JsonResponse({'error': 'Phone and order ID are required'}, status=400)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found'}, status=400)

        amount = int(order.get_cart_total)
        if amount <= 0:
            return JsonResponse({'error': 'Order amount must be greater than zero'}, status=400)

        tx = Transaction.objects.create(phone=phone, amount=amount, order=order, status='PENDING')

        client = MpesaClient()
        account_reference = 'Ltronix Shop'
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

            # Save IDs for callback matching
            response_data = vars(response) if hasattr(response, '__dict__') else response
            tx.merchant_request_id = response_data.get('MerchantRequestID')
            tx.checkout_request_id = response_data.get('CheckoutRequestID')
            tx.save()

            # Always show pending message after STK Push
            return render(request, 'store/payment_pending.html', {'transaction': tx})

        except Exception as e:
            logger.exception(f"Error during STK Push: {e}")
            tx.status = 'FAILED'
            tx.save()
            return JsonResponse({'error': f'An error occurred: {e}'}, status=500)

@csrf_exempt
def mpesa_stk_push_callback(request): # Handles M-PESA callback to update transaction status. Receives callback from M-PESA
    logger.info("M-Pesa STK Push Callback received!")
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Callback Data: {callback_data}")

        if 'Body' in callback_data and 'stkCallback' in callback_data['Body']:
            stk_callback = callback_data['Body']['stkCallback']
            result_code = stk_callback.get('ResultCode')
            merchant_request_id = stk_callback.get('MerchantRequestID')

            try:
                transaction = Transaction.objects.get(merchant_request_id=merchant_request_id)
                if result_code == 0:
                    transaction.status = 'COMPLETED'
                    transaction.save()
                    if transaction.order:
                        transaction.order.complete = True
                        transaction.order.save()
                else:
                    transaction.status = 'FAILED'
                    transaction.save()
            except Transaction.DoesNotExist:
                logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}")

    except Exception as e:
        logger.exception(f"Unexpected error in mpesa_stk_push_callback: {e}")
        return HttpResponse('Internal server error', status=500)

    return HttpResponse('OK')