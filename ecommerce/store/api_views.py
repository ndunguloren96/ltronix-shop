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
from rest_framework.views import APIView # Keep APIView for the new class

from .models import Cart, Customer, Order, OrderItem, Product
from .serializers import (OrderSerializer, ProductSerializer,
                          ReadOnlyOrderItemSerializer,
                          WritableOrderItemSerializer,
                          CartSerializer) # Ensure CartSerializer is imported

# --- REMOVE ONE OF THESE DUPLICATE ProductViewSet DEFINITIONS ---
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows products to be viewed.
    Read-only as products are managed via Django Admin.
    """
    queryset = Product.objects.select_related("category", "seller").filter(seller__is_active=True).order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
# --- REMOVE ONE OF THESE DUPLICATE ProductViewSet DEFINITIONS ---


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

    # Keep add_item for now, but the new OrderItemCreateAPIView will handle the primary 'add to cart' flow.
    # @action(detail=True, methods=["post"], url_path="add_item")
    # def add_item(self, request, pk=None):
    #     cart = self.get_object()
    #     serializer = WritableOrderItemSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     product_id = serializer.validated_data["product_id"]
    #     quantity = serializer.validated_data["quantity"]

    #     product = get_object_or_404(Product, id=product_id)
    #     seller = product.seller

    #     order, _ = Order.objects.get_or_create(cart=cart, seller=seller, complete=False)
    #     order_item, created = OrderItem.objects.get_or_create(
    #         order=order, product=product
    #     )

    #     if quantity > 0:
    #         order_item.quantity = quantity
    #         order_item.save()
    #     else:
    #         order_item.delete()

    #     return Response(self.get_serializer(cart).data)

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


# --- NEW API VIEW TO HANDLE POST TO /api/v1/orders/ ---
class OrderItemCreateAPIView(APIView):
    """
    Handles adding items to a cart/order via POST to /api/v1/orders/.
    It will create a Cart if one doesn't exist for the user/session,
    then get/create the relevant Order (per seller) and OrderItem.
    """
    permission_classes = [AllowAny] # Allow unauthenticated users for guest carts

    def post(self, request, *args, **kwargs):
        serializer = WritableOrderItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        # Determine if it's an authenticated user or a guest session
        user = request.user
        session_key = request.headers.get("X-Session-Key")
        if not session_key and not user.is_authenticated:
            # Generate a new session key if neither is provided
            session_key = str(uuid.uuid4())
            # For the response, you might want to return this session_key
            # if the frontend needs to persist it for guest users.
            # print(f"Generated new session key: {session_key}") # For debugging

        # Find or create a Cart
        cart = None
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            cart, _ = Cart.objects.get_or_create(customer=customer)
        elif session_key:
            cart, _ = Cart.objects.get_or_create(session_key=session_key)
        else:
            return Response(
                {"detail": "Cannot identify user or session for cart."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = get_object_or_404(Product, id=product_id)
        seller = product.seller

        # Get or create the specific Order associated with this cart and seller
        order, _ = Order.objects.get_or_create(cart=cart, seller=seller, complete=False)

        # Get or create the OrderItem
        order_item, created = OrderItem.objects.get_or_create(
            order=order, product=product
        )

        if quantity > 0:
            order_item.quantity = quantity
            order_item.save()
            response_status = status.HTTP_200_OK
            response_data = {"message": "Item added/updated successfully."}
        else:
            order_item.delete()
            response_status = status.HTTP_200_OK
            response_data = {"message": "Item removed successfully."}

        # Optionally, return the updated cart data or just a success message
        # If frontend needs the cart data, you'd serialize the cart here.
        # This serializer typically expects a cart object, not just an order_item.
        cart_serializer = CartSerializer(cart)
        response_data.update(cart_serializer.data)

        # Include the session_key in the response headers if it was newly generated for guest
        response = Response(response_data, status=response_status)
        if not user.is_authenticated and created and session_key: # 'created' refers to order_item creation, not session_key creation.
                                                                 # Need a better flag if session_key was newly generated.
            # Simpler: if cart was newly created for a guest, ensure session_key is returned
            if cart.session_key and session_key == cart.session_key:
                 response["X-Session-Key"] = session_key # Return the session key if it's relevant for frontend persistence
        return response
