import os
import re

from .base import *

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"] + os.environ.get(
    "ALLOWED_HOSTS", ""
).split(",")

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"postgresql://{env('DATABASE_USER')}:{env('DATABASE_PASSWORD')}@{env('DATABASE_HOST')}:{env('DATABASE_PORT')}/{env('DATABASE_NAME')}",
    )
}

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework_social_oauth2.authentication.SocialAuthentication",
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

# CORS settings for development
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

# Use Anymail/SendGrid in dev to test transactional emails (set to 'console' for local email debugging)
EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"

REST_AUTH["PASSWORD_RESET_CONFIRM_URL"] = env(
    "DJANGO_PASSWORD_RESET_CONFIRM_URL",
    default="http://localhost:3000/auth/password-reset-confirm/{uid}/{token}",
)
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env(
    "SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI",
    default="http://127.0.0.1:8000/api/auth/complete/google-oauth2/",
)
SOCIAL_AUTH_REDIRECT_IS_HTTPS = env.bool("SOCIAL_AUTH_REDIRECT_IS_HTTPS", default=False)
