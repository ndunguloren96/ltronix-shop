from django.test import TestCase
from django.contrib.auth import get_user_model
from cart.models import Cart
from .models import ShippingAddress, Payment, OrderSummary

User = get_user_model()


class CheckoutFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="checkoutuser", password="pass")
        self.cart = Cart.objects.create(user=self.user)
        self.address = ShippingAddress.objects.create(
            user=self.user,
            address="123 Main St",
            city="City",
            postal_code="12345",
            country="Country",
        )
        self.payment = Payment.objects.create(
            user=self.user, amount=100.00, payment_method="card", status="completed"
        )

    def test_create_order_summary(self):
        order = OrderSummary.objects.create(
            user=self.user,
            cart=self.cart,
            shipping_address=self.address,
            payment=self.payment,
            total=100.00,
            status="pending",
        )
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.status, "pending")
        self.assertEqual(order.total, 100.00)
