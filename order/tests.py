from django.test import TestCase
from django.contrib.auth import get_user_model
from products.models import Product
from .models import Order, OrderItem

User = get_user_model()

class OrderModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="orderuser", password="pass")
        self.product = Product.objects.create(name="Test Product", price=10.00, stock=100, description="desc")

    def test_create_order_and_items(self):
        order = Order.objects.create(user=self.user, total=0)
        item = OrderItem.objects.create(order=order, product=self.product, quantity=2, subtotal=20.00)
        order.total = item.subtotal
        order.save()
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.total, 20.00)
