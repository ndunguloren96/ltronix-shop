# ecommerce/payment/api_urls.py
from django.urls import path
from .api_views import MpesaStkPushAPIView, MpesaPaymentStatusAPIView

urlpatterns = [
    # API endpoint for initiating M-Pesa STK Push
    path('stk-push/', MpesaStkPushAPIView.as_view(), name='api_stk_push'),
    # API endpoint for checking M-Pesa transaction status
    path('status/', MpesaPaymentStatusAPIView.as_view(), name='api_payment_status'),
]

