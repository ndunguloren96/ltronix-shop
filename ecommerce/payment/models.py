# payment/models.py
import uuid  # Import uuid for generating unique transaction IDs if needed

from django.db import models
from django.utils.translation import gettext_lazy as _
from store.models import Order  # Ensure Order is correctly imported


class Transaction(models.Model):
    # Link to the Order model; set null if order can be deleted but transaction remains
    # For Ltronix Shop, a transaction should always be associated with an order.
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Associated Order"),
    )

    # Phone number used for the STK Push
    phone = models.CharField(max_length=20, verbose_name=_("Phone Number"))

    # Amount of the transaction
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Amount")
    )

    # M-Pesa specific IDs for tracking the transaction
    merchant_request_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        unique=True,
        verbose_name=_("Merchant Request ID"),
        help_text=_("Unique ID from M-Pesa for the request"),
    )
    checkout_request_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        unique=True,
        verbose_name=_("Checkout Request ID"),
        help_text=_("Unique ID from M-Pesa for the checkout process"),
    )

    # M-Pesa transaction details received in the callback
    mpesa_receipt_number = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name=_("M-Pesa Receipt Number"),
        help_text=_("The M-Pesa transaction ID (e.g., KES... )"),
    )

    # Status of the transaction
    STATUS_CHOICES = [
        ("PENDING", _("Pending")),
        ("COMPLETED", _("Completed")),
        ("FAILED", _("Failed")),
        ("CANCELLED", _("Cancelled")),  # If user cancels STK push
        ("TIMEOUT", _("Timeout")),  # If STK push times out
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
        verbose_name=_("Transaction Status"),
    )

    # Detailed status description from M-Pesa callback (e.g., "Success", "Insufficient Funds")
    result_code = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        verbose_name=_("Result Code"),
        help_text=_("Result code from M-Pesa callback (0 for success)"),
    )
    result_desc = models.TextField(
        null=True,
        blank=True,
        verbose_name=_("Result Description"),
        help_text=_("Detailed description from M-Pesa callback"),
    )

    # Used to flag if the M-Pesa callback for this transaction has been received and processed
    is_callback_received = models.BooleanField(
        default=False,
        verbose_name=_("Callback Received"),
        help_text=_("True if M-Pesa confirmation callback was received"),
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        verbose_name = _("M-Pesa Transaction")
        verbose_name_plural = _("M-Pesa Transactions")
        ordering = ["-created_at"]  # Order by most recent transaction
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"TXN {self.id} | Order {self.order.id if self.order else 'N/A'} | {self.phone} | {self.amount} | {self.status}"

    def mark_completed(self, mpesa_receipt=None, result_code=None, result_desc=None):
        """Marks the transaction as completed and updates associated order."""
        self.status = "COMPLETED"
        self.mpesa_receipt_number = mpesa_receipt
        self.result_code = str(result_code) if result_code is not None else None
        self.result_desc = result_desc
        self.is_callback_received = True
        self.save()
        if self.order and not self.order.complete:
            self.order.complete = True
            self.order.transaction_id = (
                self.mpesa_receipt_number
            )  # Use Mpesa receipt as transaction_id
            self.order.save()
            print(
                f"Order {self.order.id} marked as complete and transaction_id set to {self.mpesa_receipt_number}"
            )

    def mark_failed(self, result_code=None, result_desc=None):
        """Marks the transaction as failed."""
        self.status = "FAILED"
        self.result_code = str(result_code) if result_code is not None else None
        self.result_desc = result_desc
        self.is_callback_received = True
        self.save()
        print(f"Transaction {self.id} marked as FAILED. Reason: {result_desc}")

    def mark_timeout(self):
        """Marks the transaction as timed out."""
        self.status = "TIMEOUT"
        self.result_desc = "M-Pesa STK Push timed out."
        self.is_callback_received = True
        self.save()
        print(f"Transaction {self.id} marked as TIMEOUT.")

    def mark_cancelled(self, result_code=None, result_desc=None):
        """Marks the transaction as cancelled by the user."""
        self.status = "CANCELLED"
        self.result_code = str(result_code) if result_code is not None else None
        self.result_desc = result_desc
        self.is_callback_received = True
        self.save()
        print(f"Transaction {self.id} marked as CANCELLED by user.")
