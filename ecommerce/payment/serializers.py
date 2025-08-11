# ecommerce/payment/serializers.py
from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Mpesa Transaction model.
    Used for both input (for validation if needed) and output (sending status to frontend).
    """

    class Meta:
        model = Transaction
        fields = [
            "id",
            "order",
            "phone",
            "amount",
            "merchant_request_id",
            "checkout_request_id",
            "mpesa_receipt_number",
            "status",
            "result_code",
            "result_desc",
            "is_callback_received",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "merchant_request_id",
            "checkout_request_id",
            "mpesa_receipt_number",
            "status",
            "result_code",
            "result_desc",
            "is_callback_received",
            "created_at",
            "updated_at",
        ]