# ecommerce/sellers/serializers.py
from rest_framework import serializers
from .models import Seller
from users.serializers import UserDetailsSerializer # Now safe to import directly

class SellerSerializer(serializers.ModelSerializer):
    """
    Serializer for the Seller model.
    """
    # We can now safely use the UserDetailsSerializer directly as the circular import is broken.
    user_details = UserDetailsSerializer(source='user', read_only=True)

    class Meta:
        model = Seller
        fields = ['id', 'user_details', 'is_active', 'date_joined']
        read_only_fields = ['id', 'user_details', 'date_joined']