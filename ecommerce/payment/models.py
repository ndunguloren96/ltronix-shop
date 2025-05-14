# payment/models.py
from django.db import models
from store.models import Order

class Transaction(models.Model):
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True) # Transaction links to the Order model.
    phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    merchant_request_id = models.CharField(max_length=255, null=True, blank=True)
    checkout_request_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING')  # e.g., PENDING, COMPLETED, FAILED
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction {self.id} - {self.phone} - {self.amount}"