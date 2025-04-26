from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product
from django.shortcuts import get_object_or_404


class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer

    def get_queryset(self):
        user = self.request.user if self.request.user.is_authenticated else None
        session_key = self.request.session.session_key
        if user:
            return Cart.objects.filter(user=user)
        return Cart.objects.filter(session_key=session_key)

    @action(detail=True, methods=["post"])
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get("product")
        quantity = int(request.data.get("quantity", 1))
        product = get_object_or_404(Product, id=product_id)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity, "price_at_add": product.price},
        )
        if not created:
            item.quantity += quantity
            item.save()
        serializer = CartItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        item_id = request.data.get("item_id")
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()
        return Response({"detail": "Item removed."}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def update_quantity(self, request, pk=None):
        cart = self.get_object()
        item_id = request.data.get("item_id")
        quantity = int(request.data.get("quantity", 1))
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.quantity = quantity
        item.save()
        serializer = CartItemSerializer(item)
        return Response(serializer.data)
