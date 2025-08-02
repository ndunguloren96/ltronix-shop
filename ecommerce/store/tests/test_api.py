import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from store.models import Product, Category, Customer, Cart, Order, OrderItem
from sellers.models import Seller, SellerProfile
from decimal import Decimal

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user():
    def _create_user(email, password, is_staff=False, is_superuser=False):
        return User.objects.create_user(email=email, password=password, is_staff=is_staff, is_superuser=is_superuser)
    return _create_user

@pytest.fixture
def authenticated_client(api_client, create_user):
    user = create_user("test@example.com", "password123")
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def superuser_client(api_client, create_user):
    user = create_user("admin@example.com", "adminpass", is_superuser=True)
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def seller_user_and_profile(create_user):
    user = create_user("seller@example.com", "sellerpass")
    seller = Seller.objects.create(user=user, business_name="Test Seller")
    SellerProfile.objects.create(seller=seller)
    return user, seller

@pytest.fixture
def seller_client(api_client, seller_user_and_profile):
    user, _ = seller_user_and_profile
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def product_factory(db):
    def _product_factory(seller, name="Test Product", price=10.00, stock=10):
        category, _ = Category.objects.get_or_create(name="Electronics")
        return Product.objects.create(
            seller=seller,
            name=name,
            price=Decimal(str(price)),
            category=category,
            stock=stock
        )
    return _product_factory

@pytest.mark.django_db
class TestProductViewSet:
    def test_list_products_only_active_sellers(self, api_client, product_factory, seller_user_and_profile):
        _, seller1 = seller_user_and_profile
        seller1.is_active = True
        seller1.save()
        product1 = product_factory(seller=seller1, name="Active Product")

        user2 = User.objects.create_user("seller2@example.com", "pass")
        seller2 = Seller.objects.create(user=user2, business_name="Inactive Seller", is_active=False)
        product_factory(seller=seller2, name="Inactive Product")

        response = api_client.get(reverse("product-list"))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Active Product"

    def test_retrieve_product_from_active_seller(self, api_client, product_factory, seller_user_and_profile):
        _, seller1 = seller_user_and_profile
        seller1.is_active = True
        seller1.save()
        product1 = product_factory(seller=seller1, name="Active Product")

        response = api_client.get(reverse("product-detail", args=[product1.id]))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Active Product"

    def test_retrieve_product_from_inactive_seller_returns_404(self, api_client, product_factory, seller_user_and_profile):
        _, seller1 = seller_user_and_profile
        seller1.is_active = False
        seller1.save()
        product1 = product_factory(seller=seller1, name="Inactive Product")

        response = api_client.get(reverse("product-detail", args=[product1.id]))
        assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
class TestCartViewSet:
    def test_create_cart_for_authenticated_user(self, authenticated_client, create_user):
        user = create_user("newuser@example.com", "password123")
        authenticated_client.force_authenticate(user=user)
        response = authenticated_client.post(reverse("cart-list"))
        assert response.status_code == status.HTTP_201_CREATED
        assert "id" in response.data
        assert Cart.objects.filter(customer__user=user).exists()

    def test_create_cart_for_guest_user(self, api_client):
        response = api_client.post(reverse("cart-list"))
        assert response.status_code == status.HTTP_201_CREATED
        assert "id" in response.data
        assert "session_key" in response.data
        assert Cart.objects.filter(session_key=response.data["session_key"]).exists()

    def test_add_item_to_cart(self, api_client, product_factory, seller_user_and_profile):
        _, seller = seller_user_and_profile
        seller.is_active = True
        seller.save()
        product = product_factory(seller=seller)
        
        # Create a cart first
        cart_response = api_client.post(reverse("cart-list"))
        cart_id = cart_response.data["id"]

        response = api_client.post(
            reverse("cart-add-item", args=[cart_id]),
            {"product_id": product.id, "quantity": 1},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["orders"]) == 1
        assert len(response.data["orders"][0]["items"]) == 1
        assert response.data["orders"][0]["items"][0]["product"]["name"] == product.name

    def test_complete_order_authenticated_user(self, authenticated_client, product_factory, seller_user_and_profile):
        user, seller = seller_user_and_profile
        seller.is_active = True
        seller.save()
        product = product_factory(seller=seller, stock=5)

        customer, _ = Customer.objects.get_or_create(user=user)
        cart = Cart.objects.create(customer=customer)
        order = Order.objects.create(cart=cart, seller=seller, complete=False)
        OrderItem.objects.create(order=order, product=product, quantity=2)

        response = authenticated_client.post(reverse("cart-complete-order", args=[cart.id]))
        assert response.status_code == status.HTTP_200_OK
        
        cart.refresh_from_db()
        order.refresh_from_db()
        product.refresh_from_db()

        assert order.complete is True
        assert product.stock == 3 # 5 - 2 = 3

    def test_complete_order_guest_user_fails(self, api_client, product_factory, seller_user_and_profile):
        _, seller = seller_user_and_profile
        seller.is_active = True
        seller.save()
        product = product_factory(seller=seller, stock=5)

        cart = Cart.objects.create(session_key="guest_session")
        order = Order.objects.create(cart=cart, seller=seller, complete=False)
        OrderItem.objects.create(order=order, product=product, quantity=2)

        response = api_client.post(reverse("cart-complete-order", args=[cart.id]))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Authentication required" in response.data["detail"]

    def test_my_cart_authenticated_user(self, authenticated_client, create_user):
        user = create_user("cartuser@example.com", "password123")
        authenticated_client.force_authenticate(user=user)
        customer, _ = Customer.objects.get_or_create(user=user)
        cart = Cart.objects.create(customer=customer)

        response = authenticated_client.get(reverse("cart-my-cart"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == cart.id

    def test_my_cart_guest_user(self, api_client):
        session_key = "guest123"
        cart = Cart.objects.create(session_key=session_key)
        
        response = api_client.get(reverse("cart-my-cart"), HTTP_X_SESSION_KEY=session_key)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == cart.id
        assert response.data["session_key"] == session_key

    def test_my_cart_no_cart_found(self, api_client):
        response = api_client.get(reverse("cart-my-cart"))
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "No active cart found" in response.data["detail"]
