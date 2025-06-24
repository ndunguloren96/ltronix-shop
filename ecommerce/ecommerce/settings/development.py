# ecommerce/ecommerce/settings/development.py
from .base import *
import os
import re # Import re for regular expressions

DEBUG = True

# FIX: Removed the extra space and quote from ' 127.0.0.1'
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]'] + os.environ.get('ALLOWED_HOSTS', '').split(',')


DATABASES = {
    'default': env.db('DATABASE_URL', default=f"postgresql://{env('DATABASE_USER')}:{env('DATABASE_PASSWORD')}@{env('DATABASE_HOST')}:{env('DATABASE_PORT')}/{env('DATABASE_NAME')}")
}

# CRITICAL FIXES FOR REST_FRAMEWORK PERMISSIONS AND AUTHENTICATION
REST_FRAMEWORK = {
    **REST_FRAMEWORK, # Keep existing DRF settings from base.py
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication', # Required for browsable API and session-based auth
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication', # If using JWT with cookies (dj-rest-auth default)
        'rest_framework.authentication.TokenAuthentication', # If you configured Token authentication for any views
        # 'oauth2_provider.contrib.rest_framework.OAuth2Authentication', # Only if you explicitly use DRF-OAuth Toolkit for normal token auth
        'rest_framework_social_oauth2.authentication.SocialAuthentication', # For drf-social-oauth2
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        # Default to IsAuthenticated for API endpoints requiring login
        'rest_framework.permissions.IsAuthenticated',
        # For specific views like registration/login, permissions are set on the view itself (AllowAny)
    ),
    # Optional: Add renderer for browsable API
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': ( # Ensure JSON parsing is enabled
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser'
    )
}

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True  # TEMPORARY: For debugging CORS only.
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    # 'https://your-frontend-ngrok-url.ngrok-free.app', # Add if you Ngrok your frontend
])
# CRITICAL FIX: Added regex for dynamically assigned WSL2 IPs
CORS_ALLOWED_ORIGIN_REGEXES = [
    # Matches common local network ranges (e.g., WSL2 assigned IPs)
    # The `?` makes the port optional, accommodating origins without explicit port in the header.
    r"^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$", 
    r"^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$",
    r"^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$",
]
CORS_ALLOW_CREDENTIALS = True
# Explicitly allow standard HTTP methods for CORS
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# CSRF Trusted Origins for development
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    # 'https://your-frontend-ngrok-url.ngrok-free.app', # Add if you Ngrok your frontend
])
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Password reset confirm URL
REST_AUTH['PASSWORD_RESET_CONFIRM_URL'] = env('DJANGO_PASSWORD_RESET_CONFIRM_URL', default='http://localhost:3000/auth/password-reset-confirm/{uid}/{token}')

# Social Auth Redirect URI
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env('SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI', default='http://127.0.0.1:8000/api/auth/complete/google-oauth2/')
SOCIAL_AUTH_REDIRECT_IS_HTTPS = env.bool('SOCIAL_AUTH_REDIRECT_IS_HTTPS', default=False) # Set to False since you're not using Ngrok

# dj-rest-auth settings for JWT (if you uncommented JWT in base.py)
# If JWT is enabled, dj-rest-auth will expect JWT tokens for authentication.
# If not, it will rely on SessionAuthentication for authenticated users.
# The NextAuth.js setup in `route.ts` is designed to extract a token from Django's login response
# and use it as a Bearer token.
# The default dj-rest-auth user details view (`/auth/user/`) should work with Token/JWT authentication.

# Ensure that `dj_rest_auth.urls` in `ecommerce/ecommerce/urls.py` correctly includes the `user/` endpoint.
# It typically does, but confirm its usage in your `api_urls.py` if you have one or directly in your root urls.

