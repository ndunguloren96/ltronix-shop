# /payment

from django.shortcuts import render
from django.views import View
from django.http import JsonResponse, HttpResponse
from .models import Transaction
from django.conf import settings  # Import Django settings

class STKPushView(View): #record → initiate → persist IDs
    """
    Receives a request from the frontend containing the customer's phone number and the amount to pay.
    Creates a record of this pending transaction in your database.
    Uses the django-daraja library to send an STK Push request to the customer's phone via the M-Pesa API.
    Stores the unique transaction identifiers (MerchantRequestID and CheckoutRequestID) received from the API in your database record.
    Sends a JSON response back to the frontend, usually containing the API's response to the STK Push initiation.
    """
    def post(self, request):
        phone = request.POST['phone']
        amount = request.POST['amount']

        # record initial transaction
        tx = Transaction.objects.create(phone=phone, amount=amount)

        client = MpesaClient()
        account_reference = 'LtronixShop'  # Use a consistent account reference
        transaction_desc = 'Order payment'
        callback_url = settings.MPESA_CALLBACK_URL  # Use the callback URL from settings

        response = client.stk_push(
            phone_number=phone,
            amount=amount,
            account_reference=account_reference,
            transaction_desc=transaction_desc,
            callback_url=callback_url  # Include the callback URL
        )

        # save IDs for callback matching
        if response and 'MerchantRequestID' in response and 'CheckoutRequestID' in response:
            tx.merchant_request_id = response['MerchantRequestID']
            tx.checkout_request_id = response['CheckoutRequestID']
            tx.save()
            return JsonResponse({'Response': response})
        else:
            # Handle the case where the STK push request failed
            return JsonResponse({'error': 'Failed to initiate STK push'}, status=400)