# ecommerce/store/api_views.py
from rest_framework import viewsets, permissions
from .models import Product, Order, Customer # Ensure Customer is imported
from .serializers import ProductSerializer, OrderSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet): # Changed from ModelViewSet to ReadOnlyModelViewSet
    """
    A ViewSet for listing and retrieving product instances.
    Products are generally read-only for public API access.
    Management (create/update/delete) typically happens via Django Admin.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny] # Allow any user (authenticated or not) to read products

    def get_serializer_context(self):
        """
        Passes the request context to the serializer.
        This is essential for `image_url` to generate absolute URLs (`request.build_absolute_uri`).
        """
        return {'request': self.request} # CRUCIAL ADDITION FOR ABSOLUTE IMAGE URLs

class OrderViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing customer orders.
    Requires authentication for all actions.
    Filters orders to show only those belonging to the authenticated user.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated] # Changed to IsAuthenticated for order management

    def get_queryset(self):
        """
        Filters orders by the authenticated user's customer profile.
        If the user is an admin/staff, they might see all orders,
        but for a regular user, only their own.
        """
        user = self.request.user
        if user.is_authenticated:
            if hasattr(user, 'customer'): # Check if the user has a linked customer profile
                return Order.objects.filter(customer=user.customer)
            return Order.objects.none() # If user is authenticated but no customer profile
        return Order.objects.none() # If user is not authenticated

    def perform_create(self, serializer):
        """
        Associates the newly created order with the authenticated user's customer profile.
        Ensures a Customer profile exists for the user.
        """
        user = self.request.user
        if user.is_authenticated:
            # Get or create customer profile linked to the user
            customer, created = Customer.objects.get_or_create(user=user)
            serializer.save(customer=customer)
        else:
            # This branch should ideally not be reachable with IsAuthenticated permission_classes,
            # but is a safeguard.
            serializer.save()