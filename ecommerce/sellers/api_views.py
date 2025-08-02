# In a new file: ecommerce/sellers/api_views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
# from .permissions import IsSellerAndOwner # You will create this permission
from store.models import Product
from store.serializers import ProductSerializer

class SellerProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for sellers to manage their products.
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only show products owned by the logged-in seller."""
        return Product.objects.filter(seller__user=self.request.user)

    def perform_create(self, serializer):
        """Associate the new product with the logged-in seller."""
        serializer.save(seller=self.request.user.seller_profile)
