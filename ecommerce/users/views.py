# ecommerce/users/views.py

from rest_framework import generics, permissions
from rest_framework.response import Response
from django.conf import settings

from dj_rest_auth.views import LoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from django.contrib.auth import get_user_model

from .serializers import (
    EmailChangeSerializer,
    CustomRegisterSerializer,
    UserDetailsSerializer,
    PasswordChangeSerializer,
    CustomLoginSerializer
)

User = get_user_model()


class CustomLoginView(LoginView):
    serializer_class = CustomLoginSerializer


class CustomRegisterView(generics.CreateAPIView):
    serializer_class = CustomRegisterSerializer
    permission_classes = [permissions.AllowAny]


class PasswordChangeView(generics.UpdateAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class EmailChangeView(generics.UpdateAPIView):
    serializer_class = EmailChangeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save(request=self.request)


class AccountDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailsSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.SOCIALACCOUNT_PROVIDERS['google']['AUTH_PARAMS']['redirect_uri']
    client_class = OAuth2Client
