# /payment
from django.db import models

# Create your models here.

# This model will be used to track the lifecycle of each M-Pesa payment.
class Transaction(models.Model):
    phone = models.CharField(max_length=12)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    merchant_request_id = models.CharField(max_length=50, blank=True)
    checkout_request_id = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)