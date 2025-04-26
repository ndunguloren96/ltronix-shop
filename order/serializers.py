from rest_framework import serializers
from .models import Order, OrderItem, Payment
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "subtotal"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "method", "amount", "status", "transaction_ref", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ["id", "user", "status", "total", "created_at", "items", "payment"]


class CreateOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product", "quantity"]


class CreateOrderSerializer(serializers.ModelSerializer):
    items = CreateOrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ["user", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(user=validated_data["user"], total=0)
        total = 0
        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]
            subtotal = product.price * quantity
            OrderItem.objects.create(
                order=order, product=product, quantity=quantity, subtotal=subtotal
            )
            total += subtotal
        order.total = total
        order.save()
        return order
