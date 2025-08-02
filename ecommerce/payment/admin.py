from django.contrib import admin

from .models import Transaction  # Import the Transaction model

# Register your models here.


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "cart", "phone", "amount", "status", "created_at"]
    search_fields = ["phone", "checkout_request_id", "merchant_request_id"]
