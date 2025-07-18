# ecommerce/settings/base.py

import os
import warnings
from datetime import timedelta
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured # Keep this import, might be useful elsewhere

# Suppress dj_rest_auth deprecation warnings
warnings.filterwarnings(
    "ignore",
    message=r"app_settings\.(USERNAME|EMAIL)_REQUIRED is deprecated",
    module="dj_rest_auth.registration.serializers",
)
# FIX: Suppress the specific ACCOUNT_AUTHENTICATION_METHOD warning
warnings.filterwarnings(
    "ignore",
    message=r"app_settings\.AUTHENTICATION_METHOD is deprecated",
    module="allauth.account.app_settings",
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
    "allauth.socialaccount.providers.google", # Keep Google provider for allauth
    "oauth2_provider", # Keep if you're using Django OAuth Toolkit for your own API clients
    "rest_framework",
    "rest_framework.authtoken", # Keep if you use Django Token Authentication directly
    "rest_framework_simplejwt", # Keep for JWTs
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "drf_spectacular",
    "anymail",

    # Project apps
    "store.apps.StoreConfig",
    "payment",
    "django_daraja",
    "users", # Your custom users app
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
    "allauth.account.middleware.AccountMiddleware", # Keep for allauth
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
    "allauth.account.auth_backends.AuthenticationBackend", # Keep for allauth
)

SITE_ID = 1

# --- AllAuth specific settings ---
# FIX: Use ACCOUNT_LOGIN_METHODS instead of ACCOUNT_AUTHENTICATION_METHOD
ACCOUNT_LOGIN_METHODS = ["email"]
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_REQUIRED = True
# ACCOUNT_AUTHENTICATION_METHOD = "email" # Deprecated, replaced by ACCOUNT_LOGIN_METHODS
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = "none" # or "mandatory" depending on your flow
ACCOUNT_USER_MODEL_USERNAME_FIELD = None # Ensure this is None for email-only login
ACCOUNT_SIGNUP_FIELDS = ["email", "password"] # Simplified to match default registration

# Redirect after login/logout (can be overridden by frontend)
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

# --- Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

# --- Static & media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles" # Use Path object
# Allow Django and WhiteNoise to gather static files from your custom static folder
STATICFILES_DIRS = [
    BASE_DIR.parent / "static", # Use Path object for project-level static files
]

# Use WhiteNoise for efficient static file serving
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR.parent / "mediafiles" # Use Path object

# --- DRF settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication", # Keep if you use this explicitly
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication", # Primary for JWTs from dj-rest-auth
        "rest_framework_simplejwt.authentication.JWTAuthentication", # For general JWT validation
        "oauth2_provider.contrib.rest_framework.OAuth2Authentication", # Keep if using Django OAuth Toolkit
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "ecommerce.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 10,
}

# --- CORS/CSRF
from corsheaders.defaults import default_headers

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000", "https://ltronix-shop.vercel.app", "https://ltronix-shop.onrender.com"])
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["x-session-key"]

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000", "https://ltronix-shop.vercel.app", "https://ltronix-shop.onrender.com"])
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
# ACCOUNT_AUTHENTICATION_METHOD = "email" # Deprecated, replaced by ACCOUNT_LOGIN_METHODS
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_SIGNUP_FIELDS = ["email", "password"] # Simplified to match default registration

# --- dj-rest-auth / JWT
REST_AUTH = {
    "USE_JWT": True,
    "SESSION_LOGIN": True, # Keep this if you want session authentication for browsable API
    "JWT_AUTH_COOKIE": "my-app-jwt-access",
    "JWT_AUTH_REFRESH_COOKIE": "my-app-jwt-refresh",
    # FIX: Set JWT_AUTH_HTTPONLY to False to make tokens available in response body
    "JWT_AUTH_HTTPONLY": False, # <--- THIS IS THE CRUCIAL CHANGE
    "USER_DETAILS_SERIALIZER": "users.serializers.UserDetailsSerializer",
    "REGISTER_SERIALIZER": "users.serializers.CustomRegisterSerializer",
    "PASSWORD_RESET_USE_SITECONTROL": True,
    "PASSWORD_RESET_CONFIRM_URL": env(
        "DJANGO_PASSWORD_RESET_CONFIRM_URL",
        default="https://ltronix-shop.vercel.app/auth/password-reset-confirm/{uid}/{token}"
    ),
    "OLD_PASSWORD_FIELD_ENABLED": True,
    "GOOGLE_CLIENT_ID": env("GOOGLE_CLIENT_ID", default=""),
    "GOOGLE_CLIENT_SECRET": env("GOOGLE_CLIENT_SECRET", default=""),
}

# --- Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# --- Social Auth (Google via AllAuth)
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": env("GOOGLE_CLIENT_ID", default=""),
            "secret": env("GOOGLE_CLIENT_SECRET", default=""),
            "key": "",
        },
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "offline"},
    }
}

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

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s", "funcName": "%(funcName)s", "lineno": "%(lineno)d"}',
        },
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}", # Corrected format string
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
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
        "allauth": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

