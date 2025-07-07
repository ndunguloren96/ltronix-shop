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
    API endpoint that allows orders (and shopping carts) to be managed.
    - An 'Order' represents a shopping cart when `complete` is False.
    - For authenticated users, the cart is linked to `request.user`.
    - For unauthenticated (guest) users, the cart is linked to `session_key`.
    """

    queryset = Order.objects.all().order_by("-date_ordered")
    serializer_class = OrderSerializer
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

        if self.action == "list" and user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            return queryset.filter(customer=customer, complete=True)

        if self.action in ["retrieve", "update", "destroy", "complete_order"]:
            if user.is_authenticated:
                customer, _ = Customer.objects.get_or_create(user=user)
                return queryset.filter(customer=customer)
            elif session_key:
                return queryset.filter(session_key=session_key)
            return queryset.none()

        return queryset.all()

    def create(self, request, *args, **kwargs):
        """
        Creates or updates a shopping cart (Order with complete=False).
        Handles both authenticated and unauthenticated users.
        The request body should contain 'items': [{product_id: '...', quantity: X}]
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
            order = None
            customer = None
            created = False  # Always define this variable

            if user.is_authenticated:
                customer, _ = Customer.objects.get_or_create(user=user)
                order, created = Order.objects.get_or_create(
                    customer=customer, complete=False
                )

                if session_key:
                    guest_order = Order.objects.filter(
                        session_key=session_key, complete=False
                    ).prefetch_related('orderitem_set__product').first()
                    if guest_order and guest_order.id != order.id:
                        # Merge guest cart items into user's cart
                        existing_order_items = {item.product_id: item for item in order.orderitem_set.all()}
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
                                        order=order,
                                        quantity=guest_item.quantity,
                                    )
                                )
                        if items_to_update:
                            OrderItem.objects.bulk_update(items_to_update, ['quantity'])
                        if items_to_create:
                            OrderItem.objects.bulk_create(items_to_create)

                        guest_order.delete()
                        print(
                            f"Merged guest cart ({session_key}) into user's cart ({user.email})"
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

            if not order:
                return Response(
                    {"detail": "Unable to find or create cart."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            current_product_ids_in_payload = [
                item.get("product_id")
                for item in items_payload
                if item.get("product_id") is not None
            ]
            order.orderitem_set.exclude(
                product__id__in=current_product_ids_in_payload
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
                    print(f"Skipping invalid item data: {item_data}")
                    continue

                product = products_map.get(product_id)
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

            order.refresh_from_db()

            serializer = self.get_serializer(order)
            response_data = serializer.data
            if not user.is_authenticated and order.session_key:
                response_data["session_key"] = order.session_key

            # Always use "created" (never uninitialized)
            return Response(
                response_data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def my_cart(self, request):
        """
        Retrieves the authenticated user's current incomplete order (shopping cart)
        or a guest user's cart based on session_key.
        """
        user = request.user
        session_key_from_header = request.headers.get("X-Session-Key")

        order = None
        customer = None

        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            order = Order.objects.annotate(
                cart_total=Sum(F('orderitem__quantity') * F('orderitem__product__price')),
                cart_items_count=Sum('orderitem__quantity'),
                has_shipping_items=Case(
                    When(orderitem__product__digital=False, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField()
                )
            ).prefetch_related('orderitem_set__product').filter(customer=customer, complete=False).first()
            if not order and session_key_from_header:
                guest_order = Order.objects.filter(
                    session_key=session_key_from_header, complete=False
                ).first()
                if guest_order:
                    guest_order.customer = customer
                    guest_order.session_key = None
                    guest_order.save()
                    order = guest_order
                    print(
                        f"Authenticated user {user.email} adopted guest cart: {session_key_from_header}"
                    )

        elif session_key_from_header:
            order = Order.objects.annotate(
                cart_total=Sum(F('orderitem__quantity') * F('orderitem__product__price')),
                cart_items_count=Sum('orderitem__quantity'),
                has_shipping_items=Case(
                    When(orderitem__product__digital=False, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField()
                )
            ).prefetch_related('orderitem_set__product').filter(
                session_key=session_key_from_header, complete=False
            ).first()

        if not order:
            if not user.is_authenticated:
                new_session_key = (
                    session_key_from_header
                    if session_key_from_header
                    else str(uuid.uuid4())
                )
                order = Order.objects.create(
                    session_key=new_session_key, complete=False
                )
                print(f"Created new guest cart for session: {new_session_key}")
            else:
                pass

        serializer = self.get_serializer(order)
        response_data = serializer.data

        if not user.is_authenticated and order.session_key:
            response_data["session_key"] = order.session_key

        return Response(response_data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """
        Updates a shopping cart (Order with complete=False).
        Similar to `create` but targets an existing order.
        Handles both authenticated and unauthenticated users.
        """
        instance = self.get_object()
        user = request.user
        session_key_from_header = request.headers.get("X-Session-Key")

        if instance.complete:
            return Response(
                {"detail": "Cannot update a completed order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_authenticated:
            if not instance.customer or instance.customer.user != user:
                return Response(
                    {"detail": "You do not have permission to update this order."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif session_key_from_header:
            if instance.session_key != session_key_from_header:
                return Response(
                    {
                        "detail": "You do not have permission to update this guest order."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        items_payload = request.data.get("items", [])
        if not isinstance(items_payload, list):
            return Response(
                {"items": "Must be a list of items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            instance.orderitem_set.all().delete()

            product_ids = [item_data["product_id"] for item_data in items_payload if item_data.get("product_id")]
            products_map = {str(p.id): p for p in Product.objects.filter(id__in=product_ids)}

            items_to_create = []

            for item_data in items_payload:
                product_id = item_data.get("product_id")
                quantity = item_data.get("quantity")

                if (
                    not product_id
                    or quantity is None
                    or not isinstance(quantity, int)
                    or quantity < 0
                ):
                    print(f"Skipping invalid item data during update: {item_data}")
                    continue

                product = products_map.get(product_id)
                if not product:
                    return Response(
                        {"detail": f"Product with ID '{product_id}' not found."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if quantity > 0:
                    items_to_create.append(
                        OrderItem(
                            order=instance, product=product, quantity=quantity
                        )
                    )
            if items_to_create:
                OrderItem.objects.bulk_create(items_to_create)

            instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        response_data = serializer.data
        if not user.is_authenticated and instance.session_key:
            response_data["session_key"] = instance.session_key

        return Response(response_data, status=status.HTTP_200_OK)

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


# --- Standalone MyCartView for direct endpoint integration (/orders/my_cart/) ---
class MyCartView(APIView):
    """
    Standalone view for /orders/my_cart/ endpoint to retrieve the current (incomplete) cart.
    Mirrors the logic of OrderViewSet.my_cart for use as an independent APIView.
    """

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        user = request.user
        session_key_from_header = request.headers.get("X-Session-Key")

        order = None
        if user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user=user)
            order = Order.objects.filter(customer=customer, complete=False).first()
        elif session_key_from_header:
            order = Order.objects.filter(
                session_key=session_key_from_header, complete=False
            ).first()
        else:
            # Create a session for the guest if it does not exist
            if not request.session.session_key:
                request.session.create()
            session_key = request.session.session_key
            order = Order.objects.create(session_key=session_key, complete=False)

        serializer = OrderSerializer(order)
        response_data = serializer.data
        if not user.is_authenticated and hasattr(order, "session_key"):
            response_data["session_key"] = order.session_key
        return Response(response_data)
