import json
from decimal import Decimal
from unittest.mock import PropertyMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from payment.models import Transaction
from rest_framework.test import APIClient
from store.models import Customer, Order

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


from rest_framework.authtoken.models import Token


@pytest.fixture
def authenticated_client(api_client, customer_user):
    api_client.force_authenticate(user=customer_user.user)
    return api_client


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(email="test@example.com", password="password123")
    customer = Customer.objects.create(
        user=user, name="Test Customer", email="test@example.com"
    )
    return customer


@pytest.mark.django_db
@patch("django_daraja.mpesa.core.MpesaClient.stk_push")
def test_stk_push_initiation_success(
    mock_stk_push, authenticated_client, payment_order
):
    mock_stk_push.return_value = {
        "ResponseCode": "0",
        "MerchantRequestID": "mr_success",
        "CheckoutRequestID": "co_success",
        "CustomerMessage": "Success. Request accepted for processing",
    }
    url = reverse("api_stk_push")
    data = {
        "phone_number": "254712345678",
        "order_id": payment_order.id,
    }
    response = authenticated_client.post(url, data, format="json")
    assert response.status_code == 200
    assert Transaction.objects.filter(
        order=payment_order, status="PENDING", merchant_request_id="mr_success"
    ).exists()
    assert mock_stk_push.called


@pytest.mark.django_db
def test_stk_push_initiation_missing_data(authenticated_client):
    url = reverse("api_stk_push")
    data = {"phone_number": "254712345678"}  # Missing order_id
    response = authenticated_client.post(url, data, format="json")
    assert response.status_code == 400
    assert "order ID are required" in response.data["detail"]


@pytest.mark.django_db
def test_stk_push_initiation_invalid_phone_number(authenticated_client, payment_order):
    url = reverse("api_stk_push")
    data = {
        "phone_number": "0712345678",  # Invalid format
        "order_id": payment_order.id,
    }
    response = authenticated_client.post(url, data, format="json")
    assert response.status_code == 400
    assert "Invalid phone number format" in response.data["detail"]


@pytest.mark.django_db
def test_mpesa_callback_success(send_email_mock, api_client, payment_order):
    transaction = Transaction.objects.create(
        order=payment_order,
        phone="254712345678",
        amount=Decimal("100.00"),
        merchant_request_id="mr_callback_success",
        checkout_request_id="co_callback_success",
        status="PENDING",
    )
    url = reverse("mpesa_stk_push_callback")
    callback_data = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "mr_callback_success",
                "CheckoutRequestID": "co_callback_success",
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 100.0},
                        {"Name": "MpesaReceiptNumber", "Value": "MPESAXYZ"},
                        {"Name": "Balance", "Value": 0.0},
                        {"Name": "TransactionDate", "Value": "20240101120000"},
                        {"Name": "PhoneNumber", "Value": 254712345678},
                    ]
                },
            }
        }
    }
    response = api_client.post(
        url, json.dumps(callback_data), content_type="application/json"
    )
    assert response.status_code == 200
    transaction.refresh_from_db()
    payment_order.refresh_from_db()
    assert transaction.status == "COMPLETED"
    assert transaction.mpesa_receipt_number == "MPESAXYZ"
    assert payment_order.complete is True
    assert send_email_mock.called


@pytest.mark.django_db
def test_mpesa_callback_failed(api_client, payment_order):
    transaction = Transaction.objects.create(
        order=payment_order,
        phone="254712345678",
        amount=Decimal("100.00"),
        merchant_request_id="mr_callback_failed",
        checkout_request_id="co_callback_failed",
        status="PENDING",
    )
    url = reverse("mpesa_stk_push_callback")
    callback_data = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "mr_callback_failed",
                "CheckoutRequestID": "co_callback_failed",
                "ResultCode": 1001,
                "ResultDesc": "Insufficient funds.",
            }
        }
    }
    response = api_client.post(
        url, json.dumps(callback_data), content_type="application/json"
    )
    assert response.status_code == 200
    transaction.refresh_from_db()
    payment_order.refresh_from_db()
    assert transaction.status == "FAILED"
    assert transaction.result_desc == "Insufficient funds."


@pytest.mark.django_db
def test_get_transaction_status_authenticated(authenticated_client, payment_order):
    transaction = Transaction.objects.create(
        order=payment_order,
        phone="254712345678",
        amount=Decimal("100.00"),
        status="COMPLETED",
        merchant_request_id="mr_status_auth",
        checkout_request_id="co_status_auth",
    )
    url = reverse("api_payment_status") + f"?transaction_id={transaction.id}"
    response = authenticated_client.get(url)
    assert response.status_code == 200
    assert response.data["status"] == "COMPLETED"


@pytest.mark.django_db
def test_get_transaction_status_unauthenticated(api_client, payment_order):
    transaction = Transaction.objects.create(
        order=payment_order,
        phone="254712345678",
        amount=Decimal("100.00"),
        status="COMPLETED",
        merchant_request_id="mr_status_unauth",
        checkout_request_id="co_status_unauth",
    )
    url = reverse("api_payment_status") + f"?transaction_id={transaction.id}"
    response = api_client.get(url)
    # Should be allowed as IsAuthenticatedOrReadOnly
    assert response.status_code == 200
    assert response.data["status"] == "COMPLETED"
