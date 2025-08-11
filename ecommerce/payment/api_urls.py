# ecommerce/payment/api_urls.py
from django.urls import path

from .api_views import MpesaPaymentStatusAPIView, MpesaStkPushAPIView

# --- URL Patterns ---
# This list contains all the URL patterns for the payment API.
urlpatterns = [
    # API endpoint for initiating M-Pesa STK Push
    path("stk-push/", MpesaStkPushAPIView.as_view(), name="api_stk_push"),
    # API endpoint for checking M-Pesa transaction status
    path("status/", MpesaPaymentStatusAPIView.as_view(), name="api_payment_status"),
]