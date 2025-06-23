# ecommerce/store/serializers.py
from rest_framework import serializers
# Removed transaction import as it's primarily used in views, not directly in serializers
from .models import Product, Order, OrderItem, Customer

# --- Read-only Product Serializer (for nested use in OrderItem) ---
class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'image_url', # Using the property
            'brand', 'sku', 'rating', 'reviews_count',
            'digital', 'category', 'stock',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'image_url', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        # Build the absolute URL for the image_file
        if obj.image_file and hasattr(obj.image_file, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image_file.url)
            return obj.image_file.url # Fallback to relative if request context isn't available
        return ''

# --- Writable OrderItem Serializer (for handling input to Order) ---
# This serializer is used for validating individual item data coming from the frontend
# before the ViewSet manually processes it.
class WritableOrderItemSerializer(serializers.Serializer): # Changed to serializers.Serializer as it's not directly tied to OrderItem model save here
    product_id = serializers.CharField(max_length=255) # Assuming product ID is a string (UUID)
    quantity = serializers.IntegerField(min_value=0) # Allow 0 for removal

    class Meta:
        fields = ['product_id', 'quantity']

    def validate_product_id(self, value):
        # Ensure the product exists
        try:
            Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError(f"Product with ID '{value}' does not exist.")
        return value

    def validate(self, data):
        # We perform stock validation in the ViewSet for a more atomic check right before saving.
        # This serializer primarily ensures basic data integrity (product_id exists, quantity is integer).
        # More complex validation (like total stock vs. total quantity if multiple items added in one request)
        # is better handled in the view or a service layer.
        return data


# --- Read-only OrderItem Serializer (for outputting Order details) ---
class ReadOnlyOrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True) # Nested ProductSerializer for output
    get_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True) # Property on OrderItem model

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'get_total']


# --- Order Serializer (primarily for reading/outputting Order data) ---
class OrderSerializer(serializers.ModelSerializer):
    # This 'items' field is purely for output, fetching related OrderItems
    items = ReadOnlyOrderItemSerializer(many=True, read_only=True, source='orderitem_set')
    
    # Removed `order_items_input` field here because the ViewSet directly accesses `request.data`
    # for the input items. The ViewSet is responsible for validating and processing them.
    # WritableOrderItemSerializer is still used independently in the ViewSet for item-level validation.

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'session_key', 'date_ordered', 'complete', 'transaction_id',
            'get_cart_total', 'get_cart_items', 'shipping', 'items'
        ]
        read_only_fields = [
            'id', 'customer', 'session_key', 'date_ordered', 'complete', 'transaction_id',
            'get_cart_total', 'get_cart_items', 'shipping', 'items'
        ]

    # `create` and `update` methods are removed because `OrderViewSet` now handles
    # the creation/update of Order and OrderItems directly in its `create` and `update` methods.
    # The serializer's role is primarily to validate the top-level Order fields and
    # serialize the output.
