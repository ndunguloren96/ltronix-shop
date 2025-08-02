from django.test import TestCase
import pytest
from django.contrib.auth import get_user_model
from sellers.models import Seller, SellerProfile
from store.models import Product, Category
from rest_framework.test import APIClient
from django.urls import reverse

User = get_user_model()

@pytest.fixture
def create_user():
    def _create_user(email, password, is_staff=False, is_superuser=False):
        return User.objects.create_user(email=email, password=password, is_staff=is_staff, is_superuser=is_superuser)
    return _create_user

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def seller_user_and_profile(create_user):
    user = create_user("seller@example.com", "sellerpass")
    seller = Seller.objects.create(user=user, business_name="Test Seller")
    SellerProfile.objects.create(seller=seller)
    return user, seller

@pytest.fixture
def another_seller_user_and_profile(create_user):
    user = create_user("another_seller@example.com", "anotherpass")
    seller = Seller.objects.create(user=user, business_name="Another Seller")
    SellerProfile.objects.create(seller=seller)
    return user, seller

@pytest.fixture
def seller_client(api_client, seller_user_and_profile):
    user, _ = seller_user_and_profile
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def another_seller_client(api_client, another_seller_user_and_profile):
    user, _ = another_seller_user_and_profile
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def product_factory(db):
    def _product_factory(seller, name="Test Product", price=10.00, stock=10):
        category, _ = Category.objects.get_or_create(name="Electronics")
        return Product.objects.create(
            seller=seller,
            name=name,
            price=price,
            category=category,
            stock=stock
        )
    return _product_factory

@pytest.mark.django_db
class TestSellerModels:
    def test_seller_creation(self, create_user):
        user = create_user("test_seller@example.com", "password123")
        seller = Seller.objects.create(user=user, business_name="My Awesome Shop")
        assert seller.user == user
        assert seller.business_name == "My Awesome Shop"
        assert seller.is_active == False

    def test_seller_profile_creation(self, create_user):
        user = create_user("profile_user@example.com", "password123")
        seller = Seller.objects.create(user=user, business_name="Profile Shop")
        profile = SellerProfile.objects.create(
            seller=seller,
            contact_phone="123-456-7890",
            support_email="support@profileshop.com",
            business_address="123 Main St"
        )
        assert profile.seller == seller
        assert profile.contact_phone == "123-456-7890"

@pytest.mark.django_db
class TestSellerProductViewSet:
    def test_seller_can_list_own_products(self, seller_client, seller_user_and_profile, product_factory):
        _, seller = seller_user_and_profile
        product1 = product_factory(seller=seller, name="Seller Product 1")
        product2 = product_factory(seller=seller, name="Seller Product 2")

        response = seller_client.get(reverse("seller-products-list"))
        assert response.status_code == 200
        assert len(response.data["results"]) == 2
        assert response.data["results"][0]["name"] == "Seller Product 1"

    def test_seller_cannot_list_other_sellers_products(self, seller_client, another_seller_user_and_profile, product_factory):
        _, another_seller = another_seller_user_and_profile
        product_factory(seller=another_seller, name="Another Seller Product")

        response = seller_client.get(reverse("seller-products-list"))
        assert response.status_code == 200
        assert len(response.data["results"]) == 0

    def test_seller_can_create_product(self, seller_client, seller_user_and_profile):
        user, seller = seller_user_and_profile
        category, _ = Category.objects.get_or_create(name="Books")
        product_data = {
            "name": "New Book",
            "price": 25.00,
            "digital": True,
            "category": category.id,
            "stock": 50,
            "description": "A new digital book",
            "brand": "Self-Published",
            "sku": "NB001",
            "rating": 0.0,
            "reviews_count": 0,
        }
        response = seller_client.post(reverse("seller-products-list"), product_data, format='json')
        assert response.status_code == 201
        assert Product.objects.filter(name="New Book", seller=seller).exists()

    def test_seller_cannot_create_product_for_other_seller(self, seller_client, another_seller_user_and_profile, product_factory):
        _, another_seller = another_seller_user_and_profile
        category, _ = Category.objects.get_or_create(name="Books")
        product_data = {
            "name": "Stolen Book",
            "price": 25.00,
            "digital": True,
            "category": category.id,
            "stock": 50,
            "description": "A stolen digital book",
            "brand": "Self-Published",
            "sku": "SB001",
            "rating": 0.0,
            "reviews_count": 0,
            "seller": another_seller.id # Attempt to set another seller
        }
        response = seller_client.post(reverse("seller-products-list"), product_data, format='json')
        assert response.status_code == 400 # Should fail due to permission
        assert not Product.objects.filter(name="Stolen Book").exists()

    def test_seller_can_update_own_product(self, seller_client, seller_user_and_profile, product_factory):
        _, seller = seller_user_and_profile
        product = product_factory(seller=seller, name="Old Name")
        update_data = {"name": "Updated Name", "price": 12.00}
        response = seller_client.patch(reverse("seller-products-detail", args=[product.id]), update_data, format='json')
        assert response.status_code == 200
        product.refresh_from_db()
        assert product.name == "Updated Name"
        assert product.price == 12.00

    def test_seller_cannot_update_other_sellers_product(self, seller_client, another_seller_user_and_profile, product_factory):
        _, another_seller = another_seller_user_and_profile
        product = product_factory(seller=another_seller, name="Other Product")
        update_data = {"name": "Attempted Update"}
        response = seller_client.patch(reverse("seller-products-detail", args=[product.id]), update_data, format='json')
        assert response.status_code == 404 # Should be 404 because get_queryset filters it out
        product.refresh_from_db()
        assert product.name == "Other Product"

    def test_seller_can_delete_own_product(self, seller_client, seller_user_and_profile, product_factory):
        _, seller = seller_user_and_profile
        product = product_factory(seller=seller)
        response = seller_client.delete(reverse("seller-products-detail", args=[product.id]))
        assert response.status_code == 204
        assert not Product.objects.filter(id=product.id).exists()

    def test_seller_cannot_delete_other_sellers_product(self, seller_client, another_seller_user_and_profile, product_factory):
        _, another_seller = another_seller_user_and_profile
        product = product_factory(seller=another_seller)
        response = seller_client.delete(reverse("seller-products-detail", args=[product.id]))
        assert response.status_code == 404 # Should be 404 because get_queryset filters it out
        assert Product.objects.filter(id=product.id).exists()

    def test_unauthenticated_user_cannot_access_seller_products(self, api_client):
        response = api_client.get(reverse("seller-products-list"))
        assert response.status_code == 401
        response = api_client.post(reverse("seller-products-list"), {}, format='json')
        assert response.status_code == 401