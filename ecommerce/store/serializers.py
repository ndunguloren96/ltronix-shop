# ecommerce/store/serializers.py
from rest_framework import serializers
from .models import Product, Order, OrderItem

class ProductSerializer(serializers.ModelSerializer):
    # This will now return the full absolute URL for the image
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
            # self.context['request'] is crucial for building absolute URLs
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image_file.url)
            return obj.image_file.url # Fallback to relative if request context isn't available (e.g., from Django shell)
        return ''

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'get_total']

class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = ['id', 'customer', 'date_ordered', 'complete', 'transaction_id', 'get_cart_total', 'get_cart_items', 'shipping', 'items']

    def get_items(self, obj):
        items = obj.orderitem_set.all()
        return OrderItemSerializer(items, many=True).data