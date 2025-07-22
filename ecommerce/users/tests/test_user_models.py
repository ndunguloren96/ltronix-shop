import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_user_creation():
    user = User.objects.create_user(email="test@example.com", password="password123")
    assert user.email == "test@example.com"
    assert user.check_password("password123")
    assert user.is_active
    assert not user.is_staff
    assert not user.is_superuser


@pytest.mark.django_db
def test_superuser_creation():
    admin_user = User.objects.create_superuser(
        email="admin@example.com", password="adminpass"
    )
    assert admin_user.email == "admin@example.com"
    assert admin_user.check_password("adminpass")
    assert admin_user.is_active
    assert admin_user.is_staff
    assert admin_user.is_superuser


@pytest.mark.django_db
def test_create_user_no_email_raises_error():
    with pytest.raises(ValueError, match="The Email must be set"):
        User.objects.create_user(email="", password="password123")


@pytest.mark.django_db
def test_create_superuser_not_staff_raises_error():
    with pytest.raises(ValueError, match="Superuser must have is_staff=True."):
        User.objects.create_superuser(
            email="admin@example.com", password="adminpass", is_staff=False
        )


@pytest.mark.django_db
def test_create_superuser_not_superuser_raises_error():
    with pytest.raises(ValueError, match="Superuser must have is_superuser=True."):
        User.objects.create_superuser(
            email="admin@example.com", password="adminpass", is_superuser=False
        )
