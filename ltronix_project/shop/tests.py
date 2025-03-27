from django.test import TestCase
from django.urls import reverse
from .models import Product, Category

class ProductTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            name="Smartphone",
            description="A high-end smartphone",
            price=999.99,
            category=self.category,
        )

    def test_product_list_view(self):
        response = self.client.get(reverse("product_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Smartphone")

    def test_product_filter_by_category(self):
        response = self.client.get(reverse("product_list") + "?category=Electronics")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Smartphone")
