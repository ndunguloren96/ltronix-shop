# ecommerce/sellers/serializers.py
from rest_framework import serializers
from .models import Seller

class SellerSerializer(serializers.ModelSerializer):
    """
    Serializer for the Seller model.
    """
    # Use a string literal to avoid a circular import with users.serializers.py.
    # This defers the loading of the serializer until it's actually needed.
    user_details = 'users.serializers.UserDetailsSerializer'(source='user', read_only=True)

    class Meta:
        model = Seller
        fields = ['id', 'user_details', 'is_active', 'date_joined']
        read_only_fields = ['id', 'user_details', 'date_joined']
