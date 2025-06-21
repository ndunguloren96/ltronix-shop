# ecommerce/store/api_views.py
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated # Import specific permissions
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.utils import timezone # Import timezone for date_ordered update
import uuid # Import uuid for generating session keys

from .models import Product, Order, OrderItem, Customer # Ensure Customer is imported
from .serializers import ProductSerializer, OrderSerializer, ReadOnlyOrderItemSerializer, WritableOrderItemSerializer # Corrected imports

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows products to be viewed.
    Read-only as products are managed via Django Admin.
    """
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] # Ensure public access to product listings

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
    serializer_class = OrderSerializer # Default serializer
    permission_classes = [AllowAny] # AllowAny at class level, specific methods will enforce authentication

    # This method is crucial for filtering the base queryset that DRF uses for actions like `list`, `retrieve`, etc.
    def get_queryset(self):
        user = self.request.user
        session_key = self.request.headers.get('X-Session-Key')

        # For the `list` action (order history), only show complete orders for authenticated user
        if self.action == 'list' and user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            return self.queryset.filter(customer=customer, complete=True)

        # For `retrieve`, `update`, `destroy` on a specific Order ID
        # (e.g., getting a specific cart by ID, or updating/deleting it)
        # The logic for `my_cart` action will be separate.
        if self.action in ['retrieve', 'update', 'destroy', 'complete_order']:
            if user.is_authenticated:
                customer, _ = Customer.objects.get_or_create(user=user)
                return self.queryset.filter(customer=customer)
            elif session_key:
                return self.queryset.filter(session_key=session_key)
            return self.queryset.none()
        
        # For other actions like `create`, `my_cart`, the queryset isn't strictly filtered here
        # as the logic within those methods handles getting/creating the specific order instance.
        return self.queryset.all() # Or .none() if you want to be strict and rely only on explicit filtering


    def create(self, request, *args, **kwargs):
        """
        Creates or updates a shopping cart (Order with complete=False).
        Handles both authenticated and unauthenticated users.
        The request body should contain 'order_items_input': [{product_id: '...', quantity: X}]
        """
        user = request.user
        session_key = request.headers.get('X-Session-Key')
        order_items_input = request.data.get('order_items_input', [])

        if not isinstance(order_items_input, list):
            return Response({"order_items_input": "Must be a list of items."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order = None
            customer = None

            if user.is_authenticated:
                customer, _ = Customer.objects.get_or_create(user=user)
                order, created = Order.objects.get_or_create(customer=customer, complete=False)
                
                # If a guest cart exists for this user (they just logged in or returned with a guest session), merge it
                if session_key:
                    guest_order = Order.objects.filter(session_key=session_key, complete=False).first()
                    if guest_order and guest_order.id != order.id: # Ensure we don't try to merge the same order
                        for guest_item in guest_order.orderitem_set.all():
                            existing_item = order.orderitem_set.filter(product=guest_item.product).first()
                            if existing_item:
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
                # If unauthenticated and no session key provided, generate a new one for the guest
                new_session_key = str(uuid.uuid4())
                order = Order.objects.create(session_key=new_session_key, complete=False)
                # The frontend will pick up this new session key from the response in onSettled/onSuccess

            # If no order could be found/created (should be rare with the logic above)
            if not order:
                return Response({"detail": "Unable to find or create cart."}, status=status.HTTP_400_BAD_REQUEST)

            # --- Update Order Items based on `order_items_input` payload ---
            # This logic replaces the current cart items with the items sent in the payload.
            # This is key for the "sync entire cart state" approach from the frontend.
            
            # Get product IDs from the incoming payload
            current_product_ids_in_payload = [item.get('product_id') for item in order_items_input if item.get('product_id') is not None]
            
            # Remove any existing items in the backend cart that are NOT in the incoming payload
            # This handles deletions from the frontend cart.
            order.orderitem_set.exclude(product__id__in=current_product_ids_in_payload).delete()

            for item_data in order_items_input:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity')

                if not product_id or quantity is None or not isinstance(quantity, int) or quantity < 0:
                    print(f"Skipping invalid item data: {item_data}")
                    continue # Skip invalid items, log for debugging

                product = get_object_or_404(Product, id=product_id)

                if quantity == 0: # If quantity is 0, explicitly delete the item (already handled by exclude, but good for clarity)
                    order.orderitem_set.filter(product=product).delete()
                    continue

                # Update or create the order item
                OrderItem.objects.update_or_create(
                    order=order,
                    product=product,
                    defaults={'quantity': quantity}
                )
            
            order.refresh_from_db() # Recalculate properties like get_cart_total, get_cart_items after item modifications

            serializer = self.get_serializer(order)
            response_data = serializer.data
            # Always return the current session_key for guests for frontend persistence
            if not user.is_authenticated and order.session_key:
                response_data['session_key'] = order.session_key

            return Response(response_data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def my_cart(self, request):
        """
        Retrieves the authenticated user's current incomplete order (shopping cart)
        or a guest user's cart based on session_key.
        """
        user = request.user
        session_key_from_header = request.headers.get('X-Session-Key')

        order = None
        customer = None

        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            order = Order.objects.filter(customer=customer, complete=False).first()
        elif session_key_from_header:
            order = Order.objects.filter(session_key=session_key_from_header, complete=False).first()
        
        # If no active cart is found for current user/session, create a new guest cart
        if not order:
            new_session_key = session_key_from_header if session_key_from_header else str(uuid.uuid4())
            order = Order.objects.create(session_key=new_session_key, complete=False)
            print(f"Created new guest cart for session: {new_session_key}")

        serializer = self.get_serializer(order)
        response_data = serializer.data

        # For guests, ensure the session_key is always returned
        if not user.is_authenticated and order.session_key:
            response_data['session_key'] = order.session_key

        return Response(response_data, status=status.HTTP_200_OK)


    # Override update to handle PUT requests for updating the whole cart (e.g., clearing it)
    def update(self, request, *args, **kwargs):
        """
        Updates a shopping cart (Order with complete=False).
        Similar to `create` but targets an existing order.
        Handles both authenticated and unauthenticated users.
        """
        instance = self.get_object() # This will get the specific order by ID from URL
        user = request.user
        session_key_from_header = request.headers.get('X-Session-Key')

        if instance.complete: # Cannot update a completed order
            return Response(
                {"detail": "Cannot update a completed order."},
                status=status.HTTP_400_BAD_REQUEST # Changed to 400 as it's a client error trying to update a complete order
            )
        
        # Permission check: ensure user owns the cart or session key matches
        if user.is_authenticated:
            if not instance.customer or instance.customer.user != user:
                return Response({"detail": "You do not have permission to update this order."}, status=status.HTTP_403_FORBIDDEN)
        elif session_key_from_header:
            if instance.session_key != session_key_from_header:
                return Response({"detail": "You do not have permission to update this guest order."}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)


        order_items_input = request.data.get('order_items_input', [])
        if not isinstance(order_items_input, list):
            return Response({"order_items_input": "Must be a list of items."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Clear all existing items and re-add based on the new payload (full replacement logic)
            instance.orderitem_set.all().delete()

            for item_data in order_items_input:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity')

                if not product_id or quantity is None or not isinstance(quantity, int) or quantity < 0:
                    print(f"Skipping invalid item data during update: {item_data}")
                    continue

                product = get_object_or_404(Product, id=product_id)

                if quantity > 0:
                    OrderItem.objects.create(order=instance, product=product, quantity=quantity)
            
            instance.refresh_from_db() # Recalculate totals

        serializer = self.get_serializer(instance)
        response_data = serializer.data
        if not user.is_authenticated and instance.session_key:
            response_data['session_key'] = instance.session_key # Return session key for guests

        return Response(response_data, status=status.HTTP_200_OK)


    # Action to mark an order as complete (checkout)
    @action(detail=True, methods=['post'], url_path='complete_order', permission_classes=[IsAuthenticated])
    def complete_order(self, request, pk=None):
        """
        Marks an order as complete (checkout).
        Only authenticated users can complete an order.
        """
        order = self.get_object() # This fetches the order by PK from the URL

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to complete an order."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Ensure the authenticated user owns this cart or is taking ownership of a guest cart
        customer, _ = Customer.objects.get_or_create(user=request.user)
        if order.customer and order.customer != customer: # If it's another user's cart
            return Response({"detail": "You do not have permission to complete this order."}, status=status.HTTP_403_FORBIDDEN)
        
        # If it's a guest cart and the user is now authenticated, assign it to them
        if not order.customer and order.session_key:
            order.customer = customer
            order.session_key = None # Clear session key as it's now a user's cart
            order.save() # Save to update customer and clear session_key before completing

        if order.complete:
            return Response({"detail": "Order is already complete."}, status=status.HTTP_400_BAD_REQUEST)

        if not order.orderitem_set.exists():
            return Response({"detail": "Cannot complete an empty cart."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check stock for all items before completing
        for item in order.orderitem_set.all():
            if item.product.stock < item.quantity:
                return Response(
                    {"detail": f"Not enough stock for {item.product.name}. Available: {item.product.stock}, Requested: {item.quantity}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        with transaction.atomic():
            order.complete = True
            order.date_ordered = timezone.now()
            order.transaction_id = str(uuid.uuid4()) # Generate a unique transaction ID
            order.save()

            # Decrease product stock after successful order completion
            for item in order.orderitem_set.all():
                item.product.stock -= item.quantity
                item.product.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Override list method for authenticated users to see their complete order history
    def list(self, request, *args, **kwargs):
        """
        Retrieves the authenticated user's complete order history.
        Requires authentication.
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to view order history."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        customer, _ = Customer.objects.get_or_create(user=request.user)
        queryset = self.queryset.filter(customer=customer, complete=True) # Only complete orders for history
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # Override retrieve method to ensure users can only retrieve their own orders (or guest carts by session_key)
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object() # This gets the specific order instance by PK
        user = request.user
        session_key = request.headers.get('X-Session-Key')

        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            if instance.customer == customer:
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "You do not have permission to access this order."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif session_key:
            # Allow guest to retrieve their own incomplete cart via explicit ID if session_key matches
            if instance.session_key == session_key and not instance.complete:
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "You do not have permission to access this guest order."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )

    # Override destroy to ensure users can only delete their own incomplete carts
    # Completed orders should generally not be deletable via API
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        session_key = request.headers.get('X-Session-Key')

        if instance.complete: # Cannot delete a completed order
            return Response(
                {"detail": "Cannot delete a completed order."},
                status=status.HTTP_400_BAD_REQUEST # Changed to 400
            )

        # Permission check: ensure user owns the cart or session key matches
        if user.is_authenticated:
            if not instance.customer or instance.customer.user != user:
                return Response({"detail": "You do not have permission to delete this order."}, status=status.HTTP_403_FORBIDDEN)
        elif session_key:
            if instance.session_key != session_key:
                return Response({"detail": "You do not have permission to delete this guest order."}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        
        return super().destroy(request, *args, **kwargs)

