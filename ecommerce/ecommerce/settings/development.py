# ecommerce/settings/development.py

import os
import re

from .base import *

# --- Debugging ---
# Enable debug mode for the development environment.
DEBUG = True

# --- Allowed Hosts ---
# This list contains the allowed hostnames for the development environment.
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"] + os.environ.get(
    "ALLOWED_HOSTS", ""
).split(",")

# --- Database ---
# This setting configures the database for the development environment.
# It uses the `DATABASE_URL` environment variable to connect to a PostgreSQL database.
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"postgresql://{env('DATABASE_USER')}:{env('DATABASE_PASSWORD')}@{env('DATABASE_HOST')}:{env('DATABASE_PORT')}/{env('DATABASE_NAME')}",
    )
}

# --- Django Rest Framework ---
# This section contains settings for the Django Rest Framework in the development environment.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "drf_social_oauth2.authentication.SocialAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ),
}

# --- CORS/CSRF ---
# This section contains settings for Cross-Origin Resource Sharing (CORS) and Cross-Site Request Forgery (CSRF) protection in the development environment.
CORS_ALLOW_ALL_ORIGINS = True  # TEMPORARY: For debugging CORS only.
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"

# --- Email ---
# This setting configures the email backend for the development environment.
# It uses Anymail with SendGrid to send transactional emails.
EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"

# --- Password Reset ---
# This setting configures the password reset confirmation URL for the development environment.
REST_AUTH["PASSWORD_RESET_CONFIRM_URL"] = env(
    "DJANGO_PASSWORD_RESET_CONFIRM_URL",
    default="http://localhost:3000/auth/password-reset-confirm/{uid}/{token}",
)