# /payment

from django.shortcuts import render
from django.views import View
from django.http import JsonResponse
from daraja.mpesa import MpesaClient
from .models import Transaction

# Create your views here.


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
        response = client.stk_push(
            phone_number=phone,
            amount=amount,
            account_reference='LtronixShop',
            transaction_desc='Order payment'
        )

        # save IDs for callback matching
        tx.merchant_request_id = response['MerchantRequestID']
        tx.checkout_request_id = response['CheckoutRequestID']
        tx.save()

        return JsonResponse({'Response': response})