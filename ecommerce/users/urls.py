# ecommerce/users/urls.py

from django.urls import path, include
from django.conf import settings

from dj_rest_auth.views import LogoutView, UserDetailsView, PasswordResetView, PasswordResetConfirmView
from dj_rest_auth.registration.views import VerifyEmailView, ResendEmailVerificationView, SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client

from .views import CustomRegisterView, EmailChangeView, AccountDeleteView, UserUpdateAPIView, PasswordChangeView, CustomLoginView


class GoogleLogin(SocialLoginView):
    """View for logging in with Google."""
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.SOCIALACCOUNT_PROVIDERS['google']['AUTH_PARAMS']['redirect_uri']
    client_class = OAuth2Client

# --- URL Patterns ---
# This list contains all the URL patterns for the users app.
urlpatterns = [
    # --- Authentication ---
    path('login/', CustomLoginView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('user/', UserDetailsView.as_view(), name='rest_user_details'),

    # --- Password Management ---
    path('password/reset/', PasswordResetView.as_view(), name='rest_password_reset'),
    path('password/reset/confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/change/', PasswordChangeView.as_view(), name='rest_password_change'),

    # --- Registration ---
    path('registration/', CustomRegisterView.as_view(), name='rest_register'),
    path('register/verify-email/', VerifyEmailView.as_view(), name='rest_verify_email'),
    path('register/resend-email/', ResendEmailVerificationView.as_view(), name='rest_resend_email'),

    # --- Account Management ---
    path('email/change/', EmailChangeView.as_view(), name='rest_email_change'),
    path('account/delete/', AccountDeleteView.as_view(), name='rest_account_delete'),
    path('user/update/', UserUpdateAPIView.as_view(), name='rest_user_update'),

    # --- Social Authentication ---
    path('google/', GoogleLogin.as_view(), name="google_login"),

    # --- AllAuth ---
    path("accounts/", include("allauth.urls")),
]