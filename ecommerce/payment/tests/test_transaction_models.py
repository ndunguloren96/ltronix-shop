from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from payment.models import Transaction
from store.models import Customer, Order

User = get_user_model()


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(email="test@example.com", password="password123")
    customer = Customer.objects.create(
        user=user, name="Test Customer", email="test@example.com"
    )
    return customer


@pytest.fixture
def order(customer_user):
    return Order.objects.create(customer=customer_user, complete=False)


@pytest.mark.django_db
def test_transaction_creation(order):
    transaction = Transaction.objects.create(
        order=order,
        phone="254712345678",
        amount=Decimal("100.00"),
        merchant_request_id="mr_123",
        checkout_request_id="co_123",
        status="PENDING",
        result_code="0",
        result_desc="Success",
        is_callback_received=False,
    )
    assert transaction.order == order
    assert transaction.phone == "254712345678"
    assert transaction.amount == Decimal("100.00")
    assert transaction.status == "PENDING"


@pytest.mark.django_db
def test_transaction_mark_completed(order):
    transaction = Transaction.objects.create(
        order=order, phone="254712345678", amount=Decimal("100.00"), status="PENDING"
    )
    transaction.mark_completed(
        mpesa_receipt="MPESA123", result_code=0, result_desc="Completed successfully"
    )
    transaction.refresh_from_db()
    assert transaction.status == "COMPLETED"
    assert transaction.mpesa_receipt_number == "MPESA123"
    assert transaction.result_code == "0"
    assert transaction.result_desc == "Completed successfully"
    assert transaction.is_callback_received is True
    assert order.complete is True
    assert order.transaction_id == "MPESA123"


@pytest.mark.django_db
def test_transaction_mark_failed(order):
    transaction = Transaction.objects.create(
        order=order, phone="254712345678", amount=Decimal("100.00"), status="PENDING"
    )
    transaction.mark_failed(result_code=1, result_desc="Insufficient funds")
    transaction.refresh_from_db()
    assert transaction.status == "FAILED"
    assert transaction.result_code == "1"
    assert transaction.result_desc == "Insufficient funds"
    assert transaction.is_callback_received is True


@pytest.mark.django_db
def test_transaction_mark_timeout(order):
    transaction = Transaction.objects.create(
        order=order, phone="254712345678", amount=Decimal("100.00"), status="PENDING"
    )
    transaction.mark_timeout()
    transaction.refresh_from_db()
    assert transaction.status == "TIMEOUT"
    assert transaction.result_desc == "M-Pesa STK Push timed out."
    assert transaction.is_callback_received is True


@pytest.mark.django_db
def test_transaction_mark_cancelled(order):
    transaction = Transaction.objects.create(
        order=order, phone="254712345678", amount=Decimal("100.00"), status="PENDING"
    )
    transaction.mark_cancelled(result_code=1032, result_desc="User cancelled")
    transaction.refresh_from_db()
    assert transaction.status == "CANCELLED"
    assert transaction.result_code == "1032"
    assert transaction.result_desc == "User cancelled"
    assert transaction.is_callback_received is True
