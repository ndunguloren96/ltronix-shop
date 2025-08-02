# ecommerce/store/api_views.py
import json
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import Cart, Order, OrderItem, Product, Customer
from .serializers import CartSerializer, WritableOrderItemSerializer


class OrderViewSet(viewsets.ViewSet):
    """
    API endpoint for handling cart and order-related operations.
    - POST /api/v1/orders/ adds items to the cart.
    """

    def _get_or_create_cart(self, user, session_key):
        if user.is_authenticated:
            # If user is authenticated, use their customer cart
            customer, _ = Customer.objects.get_or_create(user=user)
            cart, created = Cart.objects.get_or_create(customer=customer)
        elif session_key:
            # If session_key is provided, use/create cart based on it
            cart, created = Cart.objects.get_or_create(session_key=session_key)
        else:
            # Otherwise, create a new cart with a new session key
            cart = Cart.objects.create()
            created = True
        return cart, created

    def create(self, request, *args, **kwargs):
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        # 1. Get or create the main Cart
        cart, cart_created = self._get_or_create_cart(user, session_key)

        items_payload = request.data.get("items")
        if items_payload is not None:
            if not isinstance(items_payload, list):
                return Response(
                    {"items": "Must be a list of items if provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Assume a single item if 'items' list is not provided
            items_payload = [request.data]

        with transaction.atomic():
            for item_data in items_payload:
                serializer = WritableOrderItemSerializer(data=item_data)
                if not serializer.is_valid(raise_exception=False):
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

                # Get or create the Order related to this Cart and Seller
                # An order groups items from a single seller within a cart
                order, _ = Order.objects.get_or_create(
                    cart=cart, seller=seller, complete=False
                )

                # Get or create the OrderItem for the product within this order
                order_item, item_created = OrderItem.objects.get_or_create(
                    order=order, product=product
                )

                # Update quantity or delete if quantity is zero
                if quantity > 0:
                    order_item.quantity = quantity
                    order_item.save()
                else:
                    order_item.delete()

        # Refresh cart instance from DB to ensure related orders/items are up-to-date
        cart.refresh_from_db()
        cart_serializer = CartSerializer(cart)
        response_data = cart_serializer.data

        # --- DEBUGGING PRINT STATEMENT ---
        # This will print the serialized data to your Render backend logs
        # or your local console if running locally.
        print(f"DEBUG: CartSerializer output for response:\n{json.dumps(response_data, indent=2)}")
        # ---------------------------------

        response_data["message"] = "Cart updated successfully."

        # Include session_key in response if it's a new unauthenticated cart
        if not user.is_authenticated and cart_created and cart.session_key:
            response_data["session_key"] = cart.session_key

        return Response(response_data, status=status.HTTP_200_OK)

    # You can add other methods like list, retrieve, update, destroy here if needed.
