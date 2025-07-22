from decimal import Decimal
from unittest.mock import PropertyMock, patch

import pytest

# ... (rest of the imports)


@pytest.fixture
def send_email_mock():
    with patch("payment.api_views.send_payment_receipt_email") as mock:
        yield mock


from django.contrib.auth import get_user_model
from store.models import Customer, Order, Product

User = get_user_model()


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(email="test@example.com", password="password123")
    customer = Customer.objects.create(
        user=user, name="Test Customer", email="test@example.com"
    )
    return customer


@pytest.fixture
def product_digital(db):
    return Product.objects.create(
        name="Digital Test Product", price=Decimal("10.00"), digital=True, stock=100
    )


@pytest.fixture
def payment_order(customer_user, product_digital):
    order_obj = Order.objects.create(customer=customer_user, complete=False)
    # Create an order item to make get_cart_total non-zero
    order_obj.orderitem_set.create(
        product=product_digital, quantity=10
    )  # 10 * 10.00 = 100.00
    return order_obj
