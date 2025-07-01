from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from store.models import Category, Customer, Order, OrderItem, Product

User = get_user_model()


@pytest.mark.django_db
def test_product_creation():
    category = Category.objects.create(name="Electronics")
    product = Product.objects.create(
        name="Test Product",
        price=100.00,
        digital=False,
        category=category,
        stock=10,
        description="A test product",
        brand="TestBrand",
        sku="TP001",
        rating=4.5,
        reviews_count=5,
    )
    assert product.name == "Test Product"
    assert product.price == Decimal("100.00")
    assert product.category.name == "Electronics"
    assert product.stock == 10
    assert product.brand == "TestBrand"
    assert product.sku == "TP001"
    assert product.rating == Decimal("4.50")
    assert product.reviews_count == 5


@pytest.mark.django_db
def test_product_image_url_property():
    product = Product.objects.create(
        name="Image Product",
        price=50.00,
        digital=False,
        stock=5,
    )
    # Simulate image_file attribute
    product.image_file.name = "product_images/test_image.jpg"
    assert product.image_url == "/media/product_images/test_image.jpg"


@pytest.mark.django_db
def test_product_image_url_property_no_image():
    product = Product.objects.create(
        name="No Image Product",
        price=20.00,
        digital=True,
        stock=20,
    )
    assert product.image_url == ""


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(email="test@example.com", password="password123")
    customer = Customer.objects.create(
        user=user, name="Test Customer", email="test@example.com"
    )
    return customer


@pytest.fixture
def store_order(customer_user):
    return Order.objects.create(customer=customer_user, complete=False)


@pytest.fixture
def product_digital(db):
    return Product.objects.create(
        name="Digital Book", price=Decimal("10.00"), digital=True, stock=100
    )


@pytest.fixture
def product_physical(db):
    return Product.objects.create(
        name="Physical Item", price=Decimal("20.00"), digital=False, stock=50
    )


@pytest.mark.django_db
def test_order_creation(customer_user, store_order):
    assert store_order.customer == customer_user
    assert store_order.complete is False
    assert store_order.get_cart_total == Decimal('0.00')
    assert store_order.get_cart_items == 0


@pytest.mark.django_db
def test_order_item_creation(customer_user, product_digital, store_order):
    order_item = OrderItem.objects.create(order=store_order, product=product_digital, quantity=2)
    assert order_item.order == store_order
    assert order_item.product == product_digital
    assert order_item.quantity == 2
    assert order_item.get_total == Decimal('20.00')


@pytest.mark.django_db
def test_order_get_cart_total(customer_user, product_digital, product_physical, store_order):
    OrderItem.objects.create(order=store_order, product=product_digital, quantity=2) # 2 * 10 = 20
    OrderItem.objects.create(order=store_order, product=product_physical, quantity=3) # 3 * 20 = 60
    assert store_order.get_cart_total == Decimal('80.00')


@pytest.mark.django_db
def test_order_get_cart_items(customer_user, product_digital, product_physical, store_order):
    OrderItem.objects.create(order=store_order, product=product_digital, quantity=2)
    OrderItem.objects.create(order=store_order, product=product_physical, quantity=3)
    assert store_order.get_cart_items == 5


@pytest.mark.django_db
def test_order_shipping_property(customer_user, product_digital, product_physical, store_order):
    
    # Case 1: Only digital products
    OrderItem.objects.create(order=store_order, product=product_digital, quantity=1)
    assert store_order.shipping is False
    store_order.orderitem_set.all().delete() # Clear items

    # Case 2: Only physical products
    OrderItem.objects.create(order=store_order, product=product_physical, quantity=1)
    assert store_order.shipping is True
    store_order.orderitem_set.all().delete() # Clear items

    # Case 3: Mix of digital and physical
    OrderItem.objects.create(order=store_order, product=product_digital, quantity=1)
    OrderItem.objects.create(order=store_order, product=product_physical, quantity=1)
    assert store_order.shipping is True
