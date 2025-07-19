# ecommerce/payment/api_views.py
import json
import logging

from django.conf import settings
from django.db import transaction as db_transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
# from django_daraja.mpesa.core import MpesaClient # REMOVED: M-Pesa specific import
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from store.models import Order
# from emails.services import send_payment_receipt # REMOVED: M-Pesa specific email logic

from .models import Transaction
from .serializers import TransactionSerializer

logger = logging.getLogger(__name__)

# All M-Pesa specific API views are removed for the Starter Launch package.
# This includes MpesaStkPushAPIView, MpesaConfirmationAPIView, and MpesaPaymentStatusAPIView.
# The `payment` app will retain its models for transaction history and future payment methods.
