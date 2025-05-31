from rest_framework import serializers
from .models import Product, Order, OrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

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
