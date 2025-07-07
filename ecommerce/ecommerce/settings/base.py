"""
# ecommerce/settings/base.py

Base Django settings for ecommerce project.
Optimized for performance, maintainability, and fast startup.
"""

import os
import warnings
from datetime import timedelta
from pathlib import Path

# Suppress dj_rest_auth deprecation warnings
warnings.filterwarnings(
    "ignore",
    message=r"app_settings\.(USERNAME|EMAIL)_REQUIRED is deprecated",
    module="dj_rest_auth.registration.serializers",
)

import sentry_sdk
from environ import Env
from sentry_sdk.integrations.django import DjangoIntegration

# --- Build paths
BASE_DIR = Path(__file__).resolve().parent.parent
env = Env()
env.read_env(os.path.join(BASE_DIR.parent, ".env"))

# --- Core Django settings
SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = False  # Overridden by environment-specific settings
ALLOWED_HOSTS = []  # Overridden by env

INSTALLED_APPS = [
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # Third-party
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "oauth2_provider",
    # "social_django", # COMMENTED OUT: Temporarily disable social_django
    # "drf_social_oauth2", # COMMENTED OUT: Temporarily disable drf_social_oauth2
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "drf_spectacular",
    "anymail",

    # Project apps
    "store.apps.StoreConfig",
    "payment",
    "django_daraja",
    "users",
    "emails",
    "storages",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "ecommerce.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                # "social_django.context_processors.backends", # COMMENTED OUT
                # "social_django.context_processors.login_redirect", # COMMENTED OUT
            ]
        },
    },
]

WSGI_APPLICATION = "ecommerce.wsgi.application"

# --- Database (override in environment-specific)
DATABASES = {"default": env.db("DATABASE_URL", default="sqlite:///db.sqlite3")}

# --- Auth & Password validation
AUTH_USER_MODEL = "users.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
    "social_core.backends.google.GoogleOAuth2",
    # "drf_social_oauth2.backends.DjangoOAuth2", # COMMENTED OUT
)

SITE_ID = 1

# --- AllAuth specific settings ---
# CRITICAL FIX: Tell AllAuth to only use email for login
ACCOUNT_LOGIN_METHODS = ["email"]
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = "optional" # or "mandatory" depending on your flow
ACCOUNT_USER_MODEL_USERNAME_FIELD = None # Ensure this is None for email-only login
ACCOUNT_SIGNUP_FIELDS = ["email", "password"] # Simplified for clarity

# --- Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

# --- Static & media
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR.parent, "mediafiles")

# --- WhiteNoise & static files configuration
# FIX: Correct STATICFILES_DIRS to point to the 'static' folder at the ecommerce project root
STATICFILES_DIRS = [os.path.join(BASE_DIR.parent, "static")]

# --- DRF settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
        "oauth2_provider.contrib.rest_framework.OAuth2Authentication",
        # "drf_social_oauth2.authentication.SocialAuthentication", # COMMENTED OUT
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# --- CORS/CSRF
from corsheaders.defaults import default_headers

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["x-session-key"]

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000"])
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True)
CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True)
SESSION_COOKIE_SAMESITE = "Lax"

# --- Celery
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = True

# --- Email via Anymail/SendGrid
ANYMAIL = {"SENDGRID_API_KEY": env("SENDGRID_API_KEY", default="")}
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@ltronix-shop.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=1025)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")

# AllAuth: disable username field if using custom User with only email
# ACCOUNT_USER_MODEL_USERNAME_FIELD = None # Already set above in AllAuth settings block
# ACCOUNT_USERNAME_REQUIRED = False # Already set above in AllAuth settings block
# ACCOUNT_SIGNUP_FIELDS = ["email", "password1", "password2"] # Simplified above to ["email", "password"]


# --- dj-rest-auth / JWT
REST_AUTH = {
    "USE_JWT": True,
    "SESSION_LOGIN": True,
    "JWT_AUTH_COOKIE": "my-app-jwt-access",
    "JWT_AUTH_REFRESH_COOKIE": "my-app-jwt-refresh",
    "USER_DETAILS_SERIALIZER": "users.serializers.UserDetailsSerializer",
    "REGISTER_SERIALIZER": "users.serializers.CustomRegisterSerializer",
    "PASSWORD_RESET_USE_SITECONTROL": True,
    "PASSWORD_RESET_CONFIRM_URL": env(
        "DJANGO_PASSWORD_RESET_CONFIRM_URL",
        default="http://localhost:3000/auth/password-reset-confirm/{uid}/{token}"
    ),
    "OLD_PASSWORD_FIELD_ENABLED": True,
}

# --- Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": SECRET_KEY,
}

# --- Social Auth (Google)
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env("SOCIAL_AUTH_GOOGLE_OAUTH2_KEY")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env("SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET")
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ["openid", "email", "profile"]
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env(
    "SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI",
    default="http://127.0.0.1:8000/api/auth/complete/google-oauth2/"
)
SOCIAL_AUTH_REDIRECT_IS_HTTPS = env.bool("SOCIAL_AUTH_REDIRECT_IS_HTTPS", default=False)

OAUTH2_PROVIDER = {
    "SCOPES": {
        "read": "Read scope",
        "write": "Write scope",
        "openid": "OpenID Connect scope",
        "profile": "User profile information",
        "email": "User email address",
    }
}

# --- M-Pesa
MPESA_CONSUMER_KEY = env("MPESA_CONSUMER_KEY")
MPESA_CONSUMER_SECRET = env("MPESA_CONSUMER_SECRET")
MPESA_SHORTCODE = env("MPESA_SHORTCODE")
MPESA_PASSKEY = env("MPESA_PASSKEY")
MPESA_CALLBACK_URL = env("MPESA_CALLBACK_URL")
MPESA_ENV = env("MPESA_ENV", default="sandbox")

# --- Sentry
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        environment=env("DJANGO_ENVIRONMENT", default="development"),
        release=env("RELEASE_VERSION", default="dev"),
        send_default_pii=True,
        traces_sample_rate=0.5,
    )

# FIX: Add DEFAULT_AUTO_FIELD for Django 3.2+
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s", "funcName": "%(funcName)s", "lineno": "%(lineno)d"}',
        },
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
        # "watchtower": {  # Uncomment if you use AWS CloudWatch
        #     "level": "INFO",
        #     "class": "watchtower.CloudWatchLogHandler",
        #     "formatter": "json",
        #     "log_group": "ltronix-shop-backend",
        # },
    },
    "root": {
        "handlers": ["console"],  # Add "watchtower" here if enabled
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],  # Add "watchtower" here if enabled
            "level": "INFO",
            "propagate": False,
        },
        "anymail": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "sentry_sdk": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

