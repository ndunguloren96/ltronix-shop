from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django_daraja.mpesa.core import MpesaClient
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from .models import Transaction
from django.conf import settings
import logging
import json

# Initialize logger
logger = logging.getLogger(__name__)


class STKPushView(View):
    """
    Handles M-Pesa STK Push requests.
    """

    def post(self, request):
        phone = request.POST.get('phone')
        amount = request.POST.get('amount')

        if not phone or not amount:
            return JsonResponse({'error': 'Phone and amount are required'}, status=400)

        try:
            amount = int(amount)
            if amount <= 0:
                return JsonResponse({'error': 'Amount must be greater than zero'}, status=400)
        except ValueError:
            return JsonResponse({'error': 'Invalid amount'}, status=400)

        # Record initial transaction
        tx = Transaction.objects.create(phone=phone, amount=amount)

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

            if response:
                response_text = response.text
                logger.info(f"Response Text: {response_text}")
                try:
                    response_json = json.loads(response_text)
                    logger.info(f"Parsed JSON Response: {response_json}")
                except json.JSONDecodeError:
                    error_message = f"Invalid JSON response from M-Pesa: {response_text}"
                    logger.error(error_message)
                    tx.status = 'ERROR'
                    tx.save()
                    return JsonResponse({'error': error_message}, status=400)

                # save IDs for callback matching
                if 'MerchantRequestID' in response_json and 'CheckoutRequestID' in response_json:
                    tx.merchant_request_id = response_json['MerchantRequestID']
                    tx.checkout_request_id = response_json['CheckoutRequestID']
                    tx.save()

                    # Extract relevant information for the template
                    response_code = response_json.get('ResponseCode')
                    response_description = response_json.get('ResponseDescription')
                    customer_message = response_json.get('CustomerMessage')

                    #  Check for success before rendering the template
                    if response_code == '0':
                        context = {
                            'merchant_request_id': response_json['MerchantRequestID'],
                            'checkout_request_id': response_json['CheckoutRequestID'],
                            'response_description': response_description,
                            'customer_message': customer_message,
                        }
                        return render(request, 'payment_success.html', context)  #  success page
                    else:
                        error_message = response_json.get('errorMessage', 'STK Push failed')
                        logger.error(f"STK Push Failed: {error_message}")
                        tx.status = 'FAILED'
                        tx.save()
                        return JsonResponse({'error': error_message}, status=400)
                else:
                    error_message = "Invalid response format: Missing MerchantRequestID or CheckoutRequestID"
                    logger.error(error_message)
                    tx.status = 'FAILED'
                    tx.save()
                    return JsonResponse({'error': error_message}, status=400)
            else:
                error_message = "Failed to initiate STK Push: Empty response"
                logger.error(error_message)
                tx.status = 'FAILED'
                tx.save()
                return JsonResponse({'error': error_message}, status=400)

        except Exception as e:
            logger.exception(f"Error during STK Push: {e}")
            tx.status = 'ERROR'
            tx.save()
            return JsonResponse({'error': f'An error occurred: {e}'}, status=500)



@csrf_exempt
def mpesa_stk_push_callback(request):
    """
    This view will receive the M-Pesa STK Push callback.  It's crucial for updating the transaction status.
    """
    logger.info("M-Pesa STK Push Callback received!")
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Callback Data: {callback_data}")

        if 'Body' in callback_data and 'stkCallback' in callback_data['Body']:
            stk_callback = callback_data['Body']['stkCallback']
            result_code = stk_callback.get('ResultCode')
            merchant_request_id = stk_callback.get('MerchantRequestID')

            if result_code == 0:
                # Transaction successful
                result_desc = stk_callback.get('ResultDesc', 'Transaction successful')
                logger.info(
                    f"Transaction successful: {result_desc}, MerchantRequestID: {merchant_request_id}")
                try:
                    transaction = Transaction.objects.get(merchant_request_id=merchant_request_id)
                    transaction.status = 'COMPLETED'
                    transaction.save()
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for MerchantRequestID: {merchant_request_id}")
                    # Consider creating a new Transaction record here if appropriate for your business logic
                except Exception as e:
                    logger.exception(f"Error updating transaction: {e}")

            else:
                # Transaction failed
                result_desc = stk_callback.get('ResultDesc', 'Transaction failed')
                logger.warning(
                    f"Transaction failed: {result_desc}, ResultCode: {result_code}, MerchantRequestID: {merchant_request_id}")
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
        return HttpResponse('Invalid JSON', status=400)

    except Exception as e:
        logger.exception(f"Unexpected error in mpesa_stk_push_callback: {e}")
        return HttpResponse('Internal server error', status=500)

    return HttpResponse('OK')
