# ecommerce/store/api_views.py
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import permissions # Import permissions
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.utils import timezone # Import timezone for date_ordered update

from .models import Product, Order, OrderItem, Customer # Ensure Customer is imported
from .serializers import ProductSerializer, OrderSerializer, ReadOnlyOrderItemSerializer, WritableOrderItemSerializer # Corrected imports

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows products to be viewed.
    Read-only as products are managed via Django Admin.
    """
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny] # Ensure public access to product listings

class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin, # Add ListModelMixin to allow listing orders (for authenticated users)
    viewsets.GenericViewSet
):
    """
    API endpoint that allows orders (and shopping carts) to be managed.
    - An 'Order' represents a shopping cart when `complete` is False.
    - For authenticated users, the cart is linked to `request.user`.
    - For unauthenticated (guest) users, the cart is linked to `session_key`.
    """
    queryset = Order.objects.all().order_by('-date_ordered') # Order by most recent
    serializer_class = OrderSerializer
    # CRITICAL CHANGE: AllowAny to support guest users.
    # Permissions will be handled manually within methods where necessary.
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Filters orders based on the authenticated user or session key.
        - Authenticated users see their complete orders and active cart.
        - Unauthenticated users (guests) see only their active cart based on session_key.
        """
        user = self.request.user
        session_key = self.request.headers.get('X-Session-Key') # Get session_key from header

        if user.is_authenticated:
            # Authenticated users can see their own orders (complete and incomplete)
            customer, created = Customer.objects.get_or_create(user=user) # Ensure customer exists for user
            return self.queryset.filter(customer=customer)
        elif session_key:
            # Unauthenticated users can only see their own incomplete order (cart) via session_key
            return self.queryset.filter(session_key=session_key, complete=False)
        return self.queryset.none() # No orders for unauthenticated users without session_key


    def create(self, request, *args, **kwargs):
        """
        Creates or updates a shopping cart (Order with complete=False).
        Handles both authenticated and unauthenticated users.
        """
        user = request.user
        session_key = request.headers.get('X-Session-Key')
        order_items_input = request.data.get('order_items_input', [])

        if not user.is_authenticated and not session_key:
            return Response(
                {"detail": "Authentication credentials or a session key must be provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        with transaction.atomic():
            order = None
            customer = None
            if user.is_authenticated:
                customer, created = Customer.objects.get_or_create(user=user)
                order, created = Order.objects.get_or_create(customer=customer, complete=False)
                # If a guest cart exists for this user (they just logged in), merge it
                if session_key:
                    guest_order = Order.objects.filter(session_key=session_key, complete=False).first()
                    if guest_order:
                        # Merge guest_order items into the authenticated order
                        for guest_item in guest_order.orderitem_set.all():
                            existing_item = order.orderitem_set.filter(product=guest_item.product).first()
                            if existing_item:
                                # Use F() for atomic update to avoid race conditions
                                existing_item.quantity = F('quantity') + guest_item.quantity
                                existing_item.save()
                            else:
                                OrderItem.objects.create(
                                    product=guest_item.product,
                                    order=order,
                                    quantity=guest_item.quantity
                                )
                        guest_order.delete() # Delete the merged guest cart
                        print(f"Merged guest cart ({session_key}) into user's cart ({user.email})")

            elif session_key:
                order, created = Order.objects.get_or_create(session_key=session_key, complete=False)
            else:
                # This case should be caught by the initial check, but as a fallback
                return Response(
                    {"detail": "Invalid request. Must be authenticated or provide a session key."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update order items based on `order_items_input`
            # This logic updates or creates order items. Items not in `order_items_input` will be removed.
            current_product_ids_in_payload = [item.get('product_id') for item in order_items_input]
            
            # Remove items from the backend cart that are not in the incoming payload
            # This handles deletions from the frontend cart
            order.orderitem_set.exclude(product__id__in=current_product_ids_in_payload).delete()

            for item_data in order_items_input:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity')

                if not product_id or quantity is None or quantity < 0: # Ensure quantity is non-negative
                    continue

                product = get_object_or_404(Product, id=product_id)

                if quantity == 0: # If quantity is 0, delete the item
                    order.orderitem_set.filter(product=product).delete()
                    continue

                # Update or create the order item
                order_item, created = OrderItem.objects.update_or_create(
                    order=order,
                    product=product,
                    defaults={'quantity': quantity}
                )
            
            # Re-fetch the order to get accurate calculated properties (get_cart_total, get_cart_items)
            # after all item modifications
            order.refresh_from_db()

            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """
        Retrieves the authenticated user's current incomplete order (shopping cart)
        or a guest user's cart based on session_key.
        """
        user = request.user
        session_key = request.headers.get('X-Session-Key')

        order = None
        customer = None
        if user.is_authenticated:
            customer, created = Customer.objects.get_or_create(user=user)
            order = Order.objects.filter(customer=customer, complete=False).first()
        elif session_key:
            order = Order.objects.filter(session_key=session_key, complete=False).first()

        if not order:
            # If no active cart exists, return an empty cart representation
            # Create a dummy order object to serialize for consistent response structure
            return Response(
                self.get_serializer(Order(customer=customer, session_key=session_key, complete=False)).data,
                status=status.HTTP_200_OK
            )
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_order(self, request, pk=None): # Renamed to complete_order to match previous immersive
        """
        Marks an order as complete (checkout).
        Only authenticated users can complete an order.
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to complete an order."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        order = get_object_or_404(Order, pk=pk, customer=request.user, complete=False) # Ensure it's their incomplete order

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
            order.date_ordered = timezone.now() # Set order completion time
            import uuid # Import uuid here if not already at top
            order.transaction_id = str(uuid.uuid4()) # Generate a unique transaction ID
            order.save()

            # Optional: Decrease product stock
            for item in order.orderitem_set.all():
                item.product.stock -= item.quantity
                item.product.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Override list method to ensure only authenticated users can see their _history_ of orders
    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to view order history."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        # Ensure only complete orders are listed as order history
        customer, created = Customer.objects.get_or_create(user=request.user)
        queryset = self.filter_queryset(self.get_queryset()).filter(complete=True, customer=customer)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # Override retrieve method to ensure users can only retrieve their own orders
    # Unauthenticated users can retrieve their cart via my_cart, but not arbitrary order IDs
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        session_key = request.headers.get('X-Session-Key')

        # Allow retrieval if authenticated user owns it, or if it's an incomplete guest cart with matching session_key
        if user.is_authenticated and instance.customer == user:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        elif not user.is_authenticated and instance.session_key == session_key and not instance.complete:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        else:
            return Response(
                {"detail": "You do not have permission to access this order."},
                status=status.HTTP_403_FORBIDDEN
            )

    # Override update/destroy to ensure users can only update/destroy their own incomplete carts
    # Completed orders should generally not be updatable/destroyable via API
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        session_key = request.headers.get('X-Session-Key')

        if instance.complete: # Cannot update a completed order
            return Response(
                {"detail": "Cannot update a completed order."},
                status=status.HTTP_403_FORBIDDEN
            )

        if (user.is_authenticated and instance.customer == user) or \
           (not user.is_authenticated and instance.session_key == session_key):
            # If order_items_input is provided, re-use the create/update logic for items.
            # Otherwise, perform standard update.
            if 'order_items_input' in request.data:
                # We need to re-validate the order items using WritableOrderItemSerializer
                # before passing to the logic within `create` method.
                order_items_serializer = WritableOrderItemSerializer(data=request.data['order_items_input'], many=True, context={'request': request})
                order_items_serializer.is_valid(raise_exception=True)
                # Pass validated data to create method for processing items
                return self.create(request, *args, **kwargs) # This will handle updates/deletes of items

            # If no order_items_input, perform a partial update on other fields
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(
                {"detail": "You do not have permission to update this order."},
                status=status.HTTP_403_FORBIDDEN
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        session_key = request.headers.get('X-Session-Key')

        if instance.complete: # Cannot delete a completed order
            return Response(
                {"detail": "Cannot delete a completed order."},
                status=status.HTTP_403_FORBIDDEN
            )

        if (user.is_authenticated and instance.customer == user) or \
           (not user.is_authenticated and instance.session_key == session_key):
            return super().destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to delete this order."},
                status=status.HTTP_403_FORBIDDEN
            )

