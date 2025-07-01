import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def _create_user(email, password):
        return User.objects.create_user(email=email, password=password)

    return _create_user


@pytest.mark.django_db
def test_user_registration(api_client):
    url = "/api/v1/auth/registration/"
    data = {
        "email": "newuser@example.com",
        "password": "newpass123",
        "password_confirm": "newpass123",
    }
    response = api_client.post(url, data, format="json")
    assert response.status_code == 201
    assert User.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_user_registration_password_mismatch(api_client):
    url = "/api/v1/auth/registration/"
    data = {
        "email": "newuser2@example.com",
        "password": "newpass123",
        "password_confirm": "wrongpass",
    }
    response = api_client.post(url, data, format="json")
    assert response.status_code == 400
    assert "password_confirm" in response.data


@pytest.mark.django_db
def test_user_login(api_client, create_user):
    user = create_user("loginuser@example.com", "loginpass123")
    url = "/api/v1/auth/login/"
    data = {
        "email": "loginuser@example.com",
        "password": "loginpass123",
    }
    response = api_client.post(url, data, format="json")
    assert response.status_code == 200
    assert (
        "key" in response.data or "access" in response.data
    )  # Check for token or JWT access token


@pytest.mark.django_db
def test_user_login_invalid_credentials(api_client):
    url = "/api/v1/auth/login/"
    data = {
        "email": "nonexistent@example.com",
        "password": "wrongpass",
    }
    response = api_client.post(url, data, format="json")
    assert response.status_code == 400  # or 401 depending on dj-rest-auth settings


@pytest.mark.django_db
def test_user_details(api_client, create_user):
    user = create_user("detailuser@example.com", "detailpass123")
    api_client.force_authenticate(user=user)
    url = "/api/v1/auth/user/"
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data["email"] == "detailuser@example.com"


@pytest.mark.django_db
def test_user_details_unauthenticated(api_client):
    url = "/api/v1/auth/user/"
    response = api_client.get(url)
    assert response.status_code == 403
