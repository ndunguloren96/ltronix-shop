from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Product, Category, Brand

User = get_user_model()


class ProductModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics", slug="electronics")
        self.brand = Brand.objects.create(name="BrandX")
        self.product = Product.objects.create(
            name="Test Product",
            description="A test product",
            price=99.99,
            stock=10,
            category=self.category,
            brand=self.brand,
            is_active=True,
        )

    def test_product_creation(self):
        self.assertEqual(self.product.name, "Test Product")
        self.assertTrue(self.product.is_in_stock)
        self.assertEqual(self.product.category.name, "Electronics")
        self.assertEqual(self.product.brand.name, "BrandX")

    def test_product_list_filter_by_category(self):
        products = Product.objects.filter(category=self.category)
        self.assertIn(self.product, products)
