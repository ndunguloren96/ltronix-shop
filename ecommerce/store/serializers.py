# ecommerce/store/serializers.py
from rest_framework import serializers

from .models import Cart, Customer, Order, OrderItem, Product


# --- Read-only Product Serializer (for nested use in OrderItem) ---
class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "name",
            "description",
            "price",
            "digital",
            "image_url",
            "brand",
            "sku",
            "rating",
            "reviews_count",
            "category",
            "stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_image_url(self, obj):
        if obj.image_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            # Fallback for when request is not in context
            return obj.image_file.url
        return None

    # Removed get_image_url method as we are no longer using SerializerMethodField for it.


# --- Writable OrderItem Serializer (for handling input to Order) ---
class WritableOrderItemSerializer(
    serializers.Serializer
):
    product_id = serializers.CharField(
        max_length=255
    )
    quantity = serializers.IntegerField(min_value=0)

    class Meta:
        fields = ["product_id", "quantity"]

    def validate_product_id(self, value):
        try:
            Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError(
                f"Product with ID '{value}' does not exist."
            )
        return value

    def validate(self, data):
        return data


# --- Read-only OrderItem Serializer (for outputting Order details) ---
class ReadOnlyOrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    get_total = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "get_total"]


# --- Order Serializer (primarily for reading/outputting Order data) ---
class OrderSerializer(serializers.ModelSerializer):
    items = ReadOnlyOrderItemSerializer(
        many=True, read_only=True, source="orderitem_set"
    )

    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cart_items_count = serializers.IntegerField(read_only=True)
    has_shipping_items = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "session_key",
            "date_ordered",
            "complete",
            "transaction_id",
            "cart_total",
            "cart_items_count",
            "has_shipping_items",
            "items",
        ]
        read_only_fields = [
            "id",
            "customer",
            "session_key",
            "date_ordered",
            "complete",
            "transaction_id",
            "cart_total",
            "cart_items_count",
            "has_shipping_items",
            "items",
        ]


class CartSerializer(serializers.ModelSerializer):
    orders = OrderSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "customer", "session_key", "orders"]

