# ecommerce/store/api_views.py
import json
import uuid
from django.db import transaction
from django.db.models import F, Sum, Case, When, Value, BooleanField
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    queryset = Order.objects.all().order_by("-date_ordered")
    serializer_class = OrderSerializer # This serializer needs to handle the new Order model structure
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        session_key = self.request.headers.get("X-Session-Key")

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
            if self.action == 'list':
                return queryset.filter(customer=customer, complete=True)
            return queryset.filter(customer=customer)
        elif session_key:
            return queryset.filter(session_key=session_key, complete=False)
            
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
            new_session_key = str(uuid.uuid4())
            cart = Cart.objects.create(session_key=new_session_key)
            created = True
        return cart, created

    def create(self, request, *args, **kwargs):
        """
        Handles adding an item to the cart (POST /api/v1/orders/).
        This method is designed to be compatible with a frontend sending
        either a single item directly or a list of items under an 'items' key.
        """
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        # 1. Get or create the main Cart
        cart, cart_created = self._get_or_create_cart(user, session_key)

        # Determine if the request contains a list of items or a single item
        items_payload = request.data.get("items")
        if items_payload is not None:
            if not isinstance(items_payload, list):
                return Response(
                    {"items": "Must be a list of items if provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # If "items" key is not present, assume it's a single item directly in request.data
            items_payload = [request.data]

        with transaction.atomic():
            for item_data in items_payload:
                serializer = WritableOrderItemSerializer(data=item_data)
                if not serializer.is_valid(raise_exception=False): # Don't raise immediately, collect errors
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                product_id = serializer.validated_data.get("product_id")
                quantity = serializer.validated_data.get("quantity")

                if product_id is None or quantity is None:
                    return Response(
                        {"detail": "Both 'product_id' and 'quantity' are required for each item."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                product = get_object_or_404(Product, id=product_id)
                seller = product.seller

                order, _ = Order.objects.get_or_create(
                    cart=cart, seller=seller, complete=False
                )

                order_item, item_created = OrderItem.objects.get_or_create(
                    order=order, product=product
                )

                if quantity > 0:
                    order_item.quantity = quantity
                    order_item.save()
                else:
                    order_item.delete()

        cart.refresh_from_db() # Refresh to get latest related objects
        cart_serializer = CartSerializer(cart)
        response_data = cart_serializer.data

        # --- DEBUGGING PRINT STATEMENT ---
        import json
        print(f"DEBUG: CartSerializer output for response:\n{json.dumps(response_data, indent=2)}")
        # ---------------------------------

        response_data["message"] = "Cart updated successfully."

        if not user.is_authenticated and cart_created and cart.session_key:
            response_data["session_key"] = cart.session_key

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="my_cart")
    def my_cart(self, request):
        """
        Retrieves the authenticated user's current active cart or a guest cart.
        """
        user = request.user
        session_key = self.request.headers.get("X-Session-Key")

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
        
        if cart.customer != customer:
            return Response(
                {"detail": "You do not have permission to complete this cart."},
                status=status.HTTP_403_FORBIDDEN,
            )

        incomplete_orders = cart.orders.filter(complete=False)
        if not incomplete_orders.exists():
            return Response(
                {"detail": "Cart is empty or already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for order in incomplete_orders:
                products_to_update = []
                for item in order.orderitem_set.select_related('product').all():
                    if item.product.stock < item.quantity:
                        transaction.set_rollback(True)
                        return Response(
                            {
                                "detail": f"Not enough stock for {item.product.name}. Available: {item.product.stock}, Requested: {item.quantity}"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    item.product.stock -= item.quantity
                    products_to_update.append(item.product)
                
                if products_to_update:
                    Product.objects.bulk_update(products_to_update, ['stock'])

                order.complete = True
                order.date_ordered = timezone.now()
                order.transaction_id = str(uuid.uuid4())
                order.save()

        cart.refresh_from_db()
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        session_key = self.request.headers.get("X-Session-Key")

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
