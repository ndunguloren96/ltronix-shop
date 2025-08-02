# ecommerce/sellers/permissions.py
from rest_framework.permissions import BasePermission

class IsSellerAndOwner(BasePermission):
    """
    Allows access only to authenticated sellers who own the object.
    """
    def has_object_permission(self, request, view, obj):
        # Assumes the object has a 'seller' attribute
        return hasattr(obj, 'seller') and request.user.is_authenticated and hasattr(request.user, 'seller_profile') and obj.seller == request.user.seller_profile
