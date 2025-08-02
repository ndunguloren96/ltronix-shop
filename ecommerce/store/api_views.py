# ecommerce/store/api_views.py
import uuid

from django.db import transaction
from django.db.models import F, Sum, Case, When, Value, BooleanField
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import (AllowAny, IsAuthenticated,
                                        IsAuthenticatedOrReadOnly)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, Customer, Order, OrderItem, Product
from .serializers import (OrderSerializer, ProductSerializer,
                          ReadOnlyOrderItemSerializer,
                          WritableOrderItemSerializer,
                          CartSerializer)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows products to be viewed.
    Read-only as products are managed via Django Admin.
    """
    queryset = Product.objects.select_related("category", "seller").filter(seller__is_active=True).order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class OrderViewSet(
    mixins.CreateModelMixin, # Needed for POST /orders/ (add to cart)
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint for managing orders and carts, primarily handling the
    frontend's expectation of /api/v1/orders/ for cart operations.
    """
    # The queryset here will be for the *main* cart (Order with complete=False)
    # or completed orders for a user.
    queryset = Order.objects.all().order_by("-date_ordered")
    serializer_class = OrderSerializer # This serializer needs to handle the new Order model structure
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        session_key = self.request.headers.get("X-Session-Key")

        # Annotate queryset with cart totals and shipping status
        queryset = self.queryset.annotate(
            cart_total=Sum(F('orderitem__quantity') * F('orderitem__product__price')),
            cart_items_count=Sum('orderitem__quantity'),
            has_shipping_items=Case(
                When(orderitem__product__digital=False, then=Value(True)),
                default=Value(False),
                output_field=BooleanField()
            )
        ).prefetch_related('orderitem_set__product')

        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            # For 'list' action, return completed orders
            if self.action == 'list':
                # This should list the *main* orders (parent orders if you have them, or all sub-orders)
                # Given your new Cart model, you might need to adjust what 'list' shows.
                # For now, let's assume it shows completed orders associated with the customer.
                return queryset.filter(customer=customer, complete=True)
            # For other actions (like retrieve, update), return all orders related to the customer
            return queryset.filter(customer=customer)
        elif session_key:
            # For guests, filter by session key for incomplete orders (carts)
            return queryset.filter(session_key=session_key, complete=False)
            
        # No user or session key, return an empty queryset
        return queryset.none()

    def _get_or_create_cart(self, user, session_key):
        """
        Helper method to get or create a Cart instance.
        """
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            cart, created = Cart.objects.get_or_create(customer=customer)
        elif session_key:
            cart, created = Cart.objects.get_or_create(session_key=session_key)
        else:
            # If neither user nor session_key, create a new session key for a guest cart
            new_session_key = str(uuid.uuid4())
            cart = Cart.objects.create(session_key=new_session_key)
            created = True
        return cart, created

    def create(self, request, *args, **kwargs):
        """
        Handles adding an item to the cart (POST /api/v1/orders/).
        This will find or create the main Cart, then the per-seller Order,
        and finally the OrderItem.
        """
        serializer = WritableOrderItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        user = request.user
        session_key = request.headers.get("X-Session-Key")

        # 1. Get or create the main Cart
        cart, cart_created = self._get_or_create_cart(user, session_key)

        product = get_object_or_404(Product, id=product_id)
        seller = product.seller

        # 2. Get or create the per-seller Order (which is essentially a sub-cart for that seller)
        order, order_created = Order.objects.get_or_create(
            cart=cart, seller=seller, complete=False
        )

        # 3. Get or create the OrderItem within that per-seller Order
        order_item, item_created = OrderItem.objects.get_or_create(
            order=order, product=product
        )

        if quantity > 0:
            order_item.quantity = quantity
            order_item.save()
            message = "Item added/updated successfully."
        else:
            order_item.delete()
            message = "Item removed successfully."

        # Return the updated main Cart data, as the frontend expects a cart response.
        # Ensure your CartSerializer can properly represent the nested Orders and OrderItems.
        cart.refresh_from_db() # Refresh to get latest related objects
        cart_serializer = CartSerializer(cart)
        response_data = cart_serializer.data
        response_data["message"] = message

        # If a new session key was generated for a guest, include it in the response
        if not user.is_authenticated and cart_created and cart.session_key:
            response_data["session_key"] = cart.session_key

        return Response(response_data, status=status.HTTP_200_OK)

    # Re-implement my_cart and complete_order actions if the frontend hits /orders/my_cart/ etc.
    # If the frontend only hits /carts/my_cart/ for these, then you can remove these from here.
    # Given the previous api_urls.py had 'orders/my_cart/', it's safer to keep it here.
    @action(detail=False, methods=["get"], url_path="my_cart")
    def my_cart(self, request):
        """
        Retrieves the authenticated user's current active cart or a guest cart.
        """
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        cart = None
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            cart = Cart.objects.filter(customer=customer).first()
        elif session_key:
            cart = Cart.objects.filter(session_key=session_key).first()

        if not cart:
            return Response(
                {"detail": "No active cart found for this session/user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CartSerializer(cart) # Use CartSerializer here
        response_data = serializer.data
        if not user.is_authenticated and cart.session_key:
            response_data["session_key"] = cart.session_key

        return Response(response_data)

    @action(
        detail=True, # This implies /orders/{id}/complete_order/
        methods=["post"],
        url_path="complete_order",
        permission_classes=[IsAuthenticated],
    )
    def complete_order(self, request, pk=None):
        """
        Marks all sub-orders within a main cart as complete (checkout).
        The 'pk' here should be the ID of the main Cart.
        """
        # We need to retrieve the Cart, not an individual Order here.
        # The frontend is likely sending the Cart ID as 'pk'.
        try:
            cart = Cart.objects.get(pk=pk)
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Cart not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to complete an order."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        customer, _ = Customer.objects.get_or_create(user=request.user)
        
        # Ensure the cart belongs to the current user
        if cart.customer != customer:
            return Response(
                {"detail": "You do not have permission to complete this cart."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if the cart has any incomplete orders
        incomplete_orders = cart.orders.filter(complete=False)
        if not incomplete_orders.exists():
            return Response(
                {"detail": "Cart is empty or already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for order in incomplete_orders:
                # Validate stock for each item in the sub-order
                products_to_update = []
                for item in order.orderitem_set.select_related('product').all():
                    if item.product.stock < item.quantity:
                        transaction.set_rollback(True) # Rollback the transaction
                        return Response(
                            {
                                "detail": f"Not enough stock for {item.product.name}. Available: {item.product.stock}, Requested: {item.quantity}"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    item.product.stock -= item.quantity
                    products_to_update.append(item.product)
                
                # Bulk update product stock for items in this sub-order
                if products_to_update:
                    Product.objects.bulk_update(products_to_update, ['stock'])

                # Mark the sub-order as complete
                order.complete = True
                order.date_ordered = timezone.now()
                order.transaction_id = str(uuid.uuid4())
                order.save()

        cart.refresh_from_db() # Refresh the main cart to reflect completed orders
        serializer = CartSerializer(cart) # Return the updated cart data
        return Response(serializer.data, status=status.HTTP_200_OK)


# The CartViewSet can remain as is, or be removed if its functionality is fully
# replaced by the OrderViewSet for frontend calls.
# Given the frontend's explicit call to /api/v1/orders/, it's safer to focus
# on making OrderViewSet handle that, and keep CartViewSet separate for /carts/
# if other parts of the frontend use it.
class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        session_key = self.request.headers.get("X-Session-Key")

        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            return Cart.objects.filter(customer=customer)
        elif session_key:
            return Cart.objects.filter(session_key=session_key)
        return Cart.objects.none()

    @action(detail=False, methods=["get"], url_path="my_cart")
    def my_cart(self, request):
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        cart = None
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            cart = Cart.objects.filter(customer=customer).first()
        elif session_key:
            cart = Cart.objects.filter(session_key=session_key).first()

        if not cart:
            return Response(
                {"detail": "No active cart found for this session/user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="add_item")
    def add_item(self, request, pk=None):
        # This action is now redundant if frontend uses /orders/ for add to cart.
        # You can remove it if you confirm no frontend code hits /carts/{id}/add_item/
        cart = self.get_object()
        serializer = WritableOrderItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        product = get_object_or_404(Product, id=product_id)
        seller = product.seller

        order, _ = Order.objects.get_or_create(cart=cart, seller=seller, complete=False)
        order_item, created = OrderItem.objects.get_or_create(
            order=order, product=product
        )

        if quantity > 0:
            order_item.quantity = quantity
            order_item.save()
        else:
            order_item.delete()

        return Response(self.get_serializer(cart).data)

    @action(detail=True, methods=["post"], url_path="complete_order")
    def complete_order(self, request, pk=None):
        # This action is also redundant if frontend uses /orders/{id}/complete_order/.
        # You can remove it if you confirm no frontend code hits /carts/{id}/complete_order/
        cart = self.get_object()
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to complete an order."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        customer, _ = Customer.objects.get_or_create(user=request.user)
        cart.customer = customer
        cart.save()

        with transaction.atomic():
            for order in cart.orders.filter(complete=False):
                order.complete = True
                order.date_ordered = timezone.now()
                order.transaction_id = str(uuid.uuid4())
                order.save()

                for item in order.orderitem_set.all():
                    item.product.stock -= item.quantity
                    item.product.save()

        return Response(self.get_serializer(cart).data)
