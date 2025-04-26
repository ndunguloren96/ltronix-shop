from django.test import TestCase
from django.contrib.auth import get_user_model
from products.models import Product
from .models import Cart, CartItem

User = get_user_model()


class CartModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="pass")
        self.product = Product.objects.create(
            name="Test Product", price=10.00, stock=100, description="desc"
        )
        self.cart = Cart.objects.create(user=self.user)

    def test_add_item_to_cart(self):
        item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
            price_at_add=self.product.price,
        )
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.cart, self.cart)
        self.assertEqual(item.product, self.product)

    def test_cart_str(self):
        self.assertIn(str(self.cart.id), str(self.cart))
