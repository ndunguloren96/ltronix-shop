# ecommerce/ecommerce/api_urls.py
from django.urls import path, include
from dj_rest_auth.registration.views import SocialLoginView
from users.views import CustomRegisterView # Assuming CustomRegisterView is moved here if api_urls.py is the primary API routing

# Define the v1 API routes
urlpatterns = [
    # dj-rest-auth URLs for authentication
    path('auth/', include('dj_rest_auth.urls')),

    # For user registration (signup)
    # Using CustomRegisterView if it's meant to be the primary registration endpoint
    path('auth/registration/', CustomRegisterView.as_view(), name='rest_register'), # Changed from dj_rest_auth.registration.urls to CustomRegisterView for consistency

    # django-allauth social account URLs. These are crucial for the OAuth flow.
    # They handle the redirection and callback logic for social providers.
    path('auth/accounts/', include('allauth.socialaccount.urls')),

    # dj-rest-auth social login endpoint for Google.
    # This is the endpoint that NextAuth.js will POST to with the Google access_token.
    path('auth/google/login/', SocialLoginView.as_view(), name='google_login'),

    # Add other general API endpoints for v1 here as needed
]