# ecommerce/users/urls.py

from django.urls import path, include
from django.conf import settings

# dj_rest_auth and allauth imports
from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView, PasswordResetView, PasswordResetConfirmView
from dj_rest_auth.registration.views import VerifyEmailView, ResendEmailVerificationView, SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client

# Import your custom views from the users app
from .views import CustomRegisterView, EmailChangeView, AccountDeleteView, UserUpdateAPIView, PasswordChangeView


# Custom GoogleLogin view to integrate with dj-rest-auth's SocialLoginView
class GoogleLogin(SocialLoginView):
    """
    A custom view that uses the SocialLoginView from dj-rest-auth to
    handle the OAuth2 authentication flow for Google.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.SOCIALACCOUNT_PROVIDERS['google']['AUTH_PARAMS']['redirect_uri']
    client_class = OAuth2Client


# All of the user and authentication URL patterns
urlpatterns = [
    # dj-rest-auth Core Authentication
    # FIX: Corrected the typo from 'as_as_view' to 'as_view'
    path('login/', LoginView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('user/', UserDetailsView.as_view(), name='rest_user_details'), # Default user details view

    # Password Management
    path('password/reset/', PasswordResetView.as_view(), name='rest_password_reset'),
    path('password/reset/confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/change/', PasswordChangeView.as_view(), name='rest_password_change'),

    # Registration
    path('register/', CustomRegisterView.as_view(), name='rest_register'),
    path('register/verify-email/', VerifyEmailView.as_view(), name='rest_verify_email'),
    path('register/resend-email/', ResendEmailVerificationView.as_view(), name='rest_resend_email'),

    # Custom User-related Views
    path('email/change/', EmailChangeView.as_view(), name='rest_email_change'),
    path('account/delete/', AccountDeleteView.as_view(), name='rest_account_delete'),
    path('user/update/', UserUpdateAPIView.as_view(), name='rest_user_update'),

    # Social Authentication
    path('google/', GoogleLogin.as_view(), name="google_login"),

    # allauth URLs (for the initial OAuth flow)
    # This must be included so that the redirect from the social provider is handled.
    path("accounts/", include("allauth.urls")),
]
