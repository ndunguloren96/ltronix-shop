from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

class UserTests(TestCase):
    def setUp(self):
        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password1": "strongpassword123",
            "password2": "strongpassword123",
        }

    def test_user_registration(self):
        response = self.client.post(reverse("register"), self.user_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful registration
        self.assertTrue(get_user_model().objects.filter(username="testuser").exists())

    def test_user_login(self):
        user = get_user_model().objects.create_user(username="testuser", password="strongpassword123")
        response = self.client.post(reverse("login"), {"username": "testuser", "password": "strongpassword123"})
        self.assertEqual(response.status_code, 302)  # Redirect after successful login
        self.assertTrue(response.wsgi_request.user.is_authenticated)
