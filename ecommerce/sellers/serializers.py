# ecommerce/sellers/serializers.py
from rest_framework import serializers
from .models import Seller, SellerProfile

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = [
            'contact_phone',
            'support_email',
            'business_address',
            'payout_details_id',
        ]
        read_only_fields = ['payout_details_id'] # Payout ID might be managed internally or by payment provider

class SellerSerializer(serializers.ModelSerializer):
    profile = SellerProfileSerializer(read_only=True) # Nested serializer for profile details
    # You might want to expose the user's email or full name here too,
    # but for simplicity, we'll keep it focused on Seller model fields.

    class Meta:
        model = Seller
        fields = [
            'id',
            'user', # You might want to remove this or make it read-only for security in public API
            'business_name',
            'is_active',
            'created_at',
            'updated_at',
            'profile', # Include the nested profile
        ]
        read_only_fields = ['id', 'user', 'is_active', 'created_at', 'updated_at']
