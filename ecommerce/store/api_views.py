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

from .models import Customer, Order, OrderItem, Product
from .serializers import (OrderSerializer, ProductSerializer,
                          ReadOnlyOrderItemSerializer,
                          WritableOrderItemSerializer)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows products to be viewed.
    Read-only as products are managed via Django Admin.
    """

    queryset = Product.objects.select_related('category', 'seller').filter(seller__is_active=True).order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


from .models import Cart, Customer, Order, OrderItem, Product
from .serializers import (
    OrderSerializer,
    ProductSerializer,
    ReadOnlyOrderItemSerializer,
    WritableOrderItemSerializer,
    CartSerializer,
)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows products to be viewed.
    Read-only as products are managed via Django Admin.
    """

    queryset = Product.objects.select_related("category", "seller").filter(seller__is_active=True).order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


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
