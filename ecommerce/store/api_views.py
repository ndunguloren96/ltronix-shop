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

    queryset = Product.objects.select_related('category').all().order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint for managing orders and carts.
    Supports cart creation, updating, retrieval, and order completion for both
    authenticated users and guests. Guest carts are managed via a session key.
    """
    queryset = Order.objects.all().order_by("-date_ordered")
    serializer_class = OrderSerializer
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
            # The 'list' action is for viewing completed order history
            if self.action == 'list':
                return queryset.filter(customer=customer, complete=True)
            # For other actions, return all of the user's orders (active and complete)
            return queryset.filter(customer=customer)
        elif session_key:
            # For guests, filter by session key
            return queryset.filter(session_key=session_key)
        
        # No user or session key, return an empty queryset
        return queryset.none()

    def _update_cart_items(self, order, items_payload):
        """
        Helper method to add, update, or remove items from a cart based on a payload.
        Ensures atomicity of database operations.
        """
        with transaction.atomic():
            current_product_ids_in_payload = [
                item.get("product_id")
                for item in items_payload
                if item.get("product_id") is not None
            ]
            # Delete any order items not present in the new payload
            order.orderitem_set.exclude(
                product__id__in=[int(pid) for pid in current_product_ids_in_payload]
            ).delete()

            product_ids = [item_data["product_id"] for item_data in items_payload if item_data.get("product_id")]
            products_map = {str(p.id): p for p in Product.objects.filter(id__in=product_ids)}

            for item_data in items_payload:
                product_id = item_data.get("product_id")
                quantity = item_data.get("quantity")

                if (
                    not product_id
                    or quantity is None
                    or not isinstance(quantity, int)
                    or quantity < 0
                ):
                    continue

                product = products_map.get(str(product_id))
                if not product:
                    return Response(
                        {"detail": f"Product with ID '{product_id}' not found."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if quantity == 0:
                    order.orderitem_set.filter(product=product).delete()
                    continue

                OrderItem.objects.update_or_create(
                    order=order, product=product, defaults={"quantity": quantity}
                )

    def create(self, request, *args, **kwargs):
        """
        Handles creating a new cart or updating an existing one.
        Merges guest cart if an authenticated user has an active guest session.
        """
        user = request.user
        session_key = request.headers.get("X-Session-Key")
        items_payload = request.data.get("items", [])

        if not isinstance(items_payload, list):
            return Response(
                {"items": "Must be a list of items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            order, created = self._get_or_create_cart(user, session_key)

            # If user logs in with a session key, merge the guest cart
            if user.is_authenticated and session_key:
                self._merge_guest_cart(user, session_key, order)

            # Update the cart items from the request payload
            self._update_cart_items(order, items_payload)

            order.refresh_from_db()

            serializer = self.get_serializer(order)
            response_data = serializer.data
            if not user.is_authenticated and order.session_key:
                response_data["session_key"] = order.session_key

            return Response(
                response_data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

    def update(self, request, *args, **kwargs):
        """
        Updates an existing cart.
        """
        instance = self.get_object()
        items_payload = request.data.get("items", [])

        if not isinstance(items_payload, list):
            return Response(
                {"items": "Must be a list of items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self._update_cart_items(instance, items_payload)

        instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _get_or_create_cart(self, user, session_key):
        """
        Helper method to get or create an active cart.
        """
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            order, created = Order.objects.get_or_create(
                customer=customer, complete=False
            )
        elif session_key:
            order, created = Order.objects.get_or_create(
                session_key=session_key, complete=False
            )
        else:
            new_session_key = str(uuid.uuid4())
            order = Order.objects.create(
                session_key=new_session_key, complete=False
            )
            created = True
        return order, created

    def _merge_guest_cart(self, user, session_key, user_cart):
        """
        Helper method to merge a guest cart into a user's cart.
        """
        guest_order = Order.objects.filter(
            session_key=session_key, complete=False
        ).prefetch_related('orderitem_set__product').first()

        if guest_order and guest_order.id != user_cart.id:
            existing_order_items = {item.product_id: item for item in user_cart.orderitem_set.all()}
            items_to_create = []
            items_to_update = []

            for guest_item in guest_order.orderitem_set.all():
                if guest_item.product_id in existing_order_items:
                    existing_item = existing_order_items[guest_item.product_id]
                    existing_item.quantity = F("quantity") + guest_item.quantity
                    items_to_update.append(existing_item)
                else:
                    items_to_create.append(
                        OrderItem(
                            product=guest_item.product,
                            order=user_cart,
                            quantity=guest_item.quantity,
                        )
                    )
            if items_to_update:
                OrderItem.objects.bulk_update(items_to_update, ['quantity'])
            if items_to_create:
                OrderItem.objects.bulk_create(items_to_create)

            guest_order.delete()

    @action(
        detail=True,
        methods=["post"],
        url_path="complete_order",
        permission_classes=[IsAuthenticated],
    )
    def complete_order(self, request, pk=None):
        """
        Marks an order as complete (checkout).
        Only authenticated users can complete an order.
        """
        order = self.get_object()

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to complete an order."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        customer, _ = Customer.objects.get_or_create(user=request.user)
        if order.customer and order.customer != customer:
            return Response(
                {"detail": "You do not have permission to complete this order."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not order.customer and order.session_key:
            order.customer = customer
            order.session_key = None
            order.save()

        if order.complete:
            return Response(
                {"detail": "Order is already complete."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prefetch related products to avoid N+1 queries
        order_items = order.orderitem_set.select_related('product').all()

        if not order_items.exists():
            return Response(
                {"detail": "Cannot complete an empty cart."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        products_to_update = []
        for item in order_items:
            if item.product.stock < item.quantity:
                return Response(
                    {
                        "detail": f"Not enough stock for {item.product.name}. Available: {item.product.stock}, Requested: {item.quantity}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.product.stock -= item.quantity
            products_to_update.append(item.product)

        with transaction.atomic():
            order.complete = True
            order.date_ordered = timezone.now()
            order.transaction_id = str(uuid.uuid4())
            order.save()

            # Bulk update product stock
            Product.objects.bulk_update(products_to_update, ['stock'])

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["get"],
        url_path="my_cart",
        permission_classes=[AllowAny], # Allow guest access
    )
    def my_cart(self, request):
        """
        Retrieves the authenticated user's current active cart or a guest cart.
        """
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        order = None
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            order = Order.objects.filter(customer=customer, complete=False).first()
        elif session_key:
            order = Order.objects.filter(session_key=session_key, complete=False).first()

        if not order:
            return Response(
                {"detail": "No active cart found for this session/user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(order)
        response_data = serializer.data
        if not user.is_authenticated and order.session_key:
            # Return session key for guest carts
            response_data["session_key"] = order.session_key

        return Response(response_data)

    @action(
        detail=False,
        methods=["post"],
        url_path="merge_guest_cart",
        permission_classes=[IsAuthenticated], # Only authenticated users can merge
    )
    def merge_guest_cart(self, request):
        """
        Merges a guest cart into an authenticated user's cart.
        Requires authentication and a guest session key.
        """
        user = request.user
        guest_session_key = request.data.get("guest_session_key")
        guest_items_payload = request.data.get("items", [])

        if not user.is_authenticated:
            return Response(
                {"detail": "Authentication required to merge carts."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not guest_session_key:
            return Response(
                {"detail": "Guest session key is required for merging."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(guest_items_payload, list):
            return Response(
                {"items": "Guest items must be a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user_customer, _ = Customer.objects.get_or_create(user=user)
            user_cart, _ = Order.objects.get_or_create(customer=user_customer, complete=False)

            guest_order = Order.objects.filter(
                session_key=guest_session_key, complete=False
            ).prefetch_related('orderitem_set__product').first()

            if guest_order and guest_order.id != user_cart.id:
                # Use the existing _merge_guest_cart helper
                self._merge_guest_cart(user, guest_session_key, user_cart)
                guest_order.delete() # Ensure the old guest cart is deleted

            # After merging, update the user_cart with any new items from the payload
            self._update_cart_items(user_cart, guest_items_payload)


            user_cart.refresh_from_db() # Refresh to get latest totals

            serializer = self.get_serializer(user_cart)
            return Response(serializer.data, status=status.HTTP_200_OK)


    def list(self, request, *args, **kwargs):
        """
        Retrieves the authenticated user's complete order history.
        Requires authentication.
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to view order history."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        customer, _ = Customer.objects.get_or_create(user=request.user)
        queryset = self.queryset.filter(customer=customer, complete=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            if instance.customer == customer:
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "You do not have permission to access this order."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif session_key:
            if instance.session_key == session_key and not instance.complete:
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            else:
                return Response(
                    {
                        "detail": "You do not have permission to access this guest order."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        session_key = request.headers.get("X-Session-Key")

        if instance.complete:
            return Response(
                {"detail": "Cannot delete a completed order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_authenticated:
            if not instance.customer or instance.customer.user != user:
                return Response(
                    {"detail": "You do not have permission to delete this order."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif session_key:
            if instance.session_key != session_key:
                return Response(
                    {
                        "detail": "You do not have permission to delete this guest order."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return super().destroy(request, *args, **kwargs)
