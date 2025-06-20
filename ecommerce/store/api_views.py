# ecommerce/store/api_views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action # Import action for custom viewset actions
from django.shortcuts import get_object_or_404
from django.db import transaction # For atomic operations

from .models import Product, Order, OrderItem, Customer
from .serializers import ProductSerializer, OrderSerializer, WritableOrderItemSerializer, ReadOnlyOrderItemSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
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
        return {'request': self.request}

class OrderViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing customer orders.
    Requires authentication for all actions.
    Filters orders to show only those belonging to the authenticated user.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filters orders by the authenticated user's customer profile.
        A user can only view their own orders/carts.
        Admins/staff can view all orders (by default behavior of ModelViewSet
        if this method isn't overridden for superusers).
        """
        user = self.request.user
        if user.is_authenticated:
            customer, created = Customer.objects.get_or_create(user=user)
            return Order.objects.filter(customer=customer).order_by('-date_ordered')
        return Order.objects.none() # If user is not authenticated

    def get_serializer(self, *args, **kwargs):
        """
        Pass the request context to the serializer.
        """
        kwargs['context'] = {'request': self.request}
        return super().get_serializer(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        """
        Handles creating a new order (cart) or updating an existing one.
        Expects 'order_items_input' containing a list of {product_id, quantity} dicts.
        """
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentication required to create or update cart."},
                            status=status.HTTP_401_UNAUTHORIZED)

        customer, created = Customer.objects.get_or_create(user=user)
        # Attempt to find an existing incomplete order (cart) for the user
        existing_cart = Order.objects.filter(customer=customer, complete=False).first()

        # Use the serializer for validation.
        # When creating a new cart, the serializer will handle initial validation.
        # When updating, we use the existing instance.
        if existing_cart:
            serializer = self.get_serializer(existing_cart, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            if existing_cart:
                # Update the existing cart
                order = self.perform_update(serializer)
            else:
                # Create a new cart
                order = self.perform_create(serializer) # serializer.save(customer=customer, complete=False) is handled by serializer.create

            # After saving the order, we need to manually process the nested order_items_input.
            # The serializer's create/update methods already handle this due to the `items` source.
            # However, if your frontend sends the items as `order_items_input`,
            # we need to pass that to serializer.save(). Let's re-verify the serializer `source` logic.

            # Re-fetch the order to get updated calculated properties like get_cart_total
            order.refresh_from_db()
            response_serializer = self.get_serializer(order) # Use the read-only serializer for response

        return Response(response_serializer.data, status=status.HTTP_200_OK if existing_cart else status.HTTP_201_CREATED)


    def perform_create(self, serializer):
        """
        Custom perform_create to set customer and initial complete status.
        The nested item creation is handled by the serializer's `create` method.
        """
        user = self.request.user
        customer, created = Customer.objects.get_or_create(user=user)
        # Ensure the order is created as incomplete (a cart)
        return serializer.save(customer=customer, complete=False)


    def perform_update(self, serializer):
        """
        Custom perform_update to manage nested order items.
        The serializer's `update` method is designed to handle this.
        """
        return serializer.save() # The serializer's update method handles items processing

    # Custom action to "complete" an order (i.e., checkout the cart)
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_order(self, request, pk=None):
        """
        Marks an order as complete (checkout).
        Expects the order ID in the URL.
        """
        order = get_object_or_404(Order, pk=pk, customer=request.user.customer, complete=False)
        
        # Additional validation before completing:
        # - Check if cart is empty
        if not order.orderitem_set.exists():
            return Response({"detail": "Cannot complete an empty cart."}, status=status.HTTP_400_BAD_REQUEST)
        
        # - Check stock for all items
        for item in order.orderitem_set.all():
            if item.product.stock < item.quantity:
                return Response(
                    {"detail": f"Not enough stock for {item.product.name}. Available: {item.product.stock}, Requested: {item.quantity}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        with transaction.atomic():
            order.complete = True
            # Generate a transaction ID (you might integrate with a payment gateway here)
            import uuid
            order.transaction_id = str(uuid.uuid4())
            order.save()

            # Optional: Decrease product stock
            for item in order.orderitem_set.all():
                item.product.stock -= item.quantity
                item.product.save()

            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)

    # Custom action to get the active cart for the authenticated user
    @action(detail=False, methods=['get'], url_path='my_cart')
    def my_cart(self, request):
        """
        Retrieves the authenticated user's active shopping cart (incomplete order).
        If no cart exists, returns an empty object or a 404.
        """
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentication required to view cart."},
                            status=status.HTTP_401_UNAUTHORIZED)

        customer, created = Customer.objects.get_or_create(user=user)
        cart = Order.objects.filter(customer=customer, complete=False).first()

        if not cart:
            # If no active cart exists, return a structured empty cart response
            return Response({
                "id": None,
                "customer": customer.id,
                "date_ordered": None,
                "complete": False,
                "transaction_id": None,
                "get_cart_total": "0.00",
                "get_cart_items": 0,
                "shipping": False,
                "items": []
            }, status=status.HTTP_200_OK) # Return 200 with empty data, not 404

        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

