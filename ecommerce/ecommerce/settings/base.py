# ecommerce/settings/base.py

import os
import warnings
from datetime import timedelta
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

# Suppress dj_rest_auth deprecation warnings - REMOVED as dj_rest_auth is removed for Starter
# warnings.filterwarnings(
#     "ignore",
#     message=r"app_settings\.(USERNAME|EMAIL)_REQUIRED is deprecated",
#     module="dj_rest_auth.registration.serializers",
# )

# Sentry import remains for now as it's a separate removal step
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
    "django.contrib.sites", # Keep if Site framework is used, generally harmless

    # Third-party (Authentication related removed)
    "corsheaders",
    # "allauth", # REMOVED
    # "allauth.account", # REMOVED
    # "allauth.socialaccount", # REMOVED
    # "allauth.socialaccount.providers.google", # REMOVED
    "oauth2_provider", # Keep, might be for internal API clients or future
    "rest_framework",
    "rest_framework.authtoken", # Keep, potentially useful for internal token access or dev
    "rest_framework_simplejwt", # Keep for JWTs if used for other internal services
    # "dj_rest_auth", # REMOVED
    # "dj_rest_auth.registration", # REMOVED
    "drf_spectacular", # Keep for API documentation
    "anymail", # Keep for now, email services will be removed separately

    # Project apps
    "store.apps.StoreConfig",
    "payment", # Keep, models might be used, will disable views later
    "django_daraja", # Keep for now, M-Pesa will be removed separately
    "users", # Your custom users app - essential for User model and Admin
    "emails", # Keep for now, email app will be removed separately
    "storages", # Keep for S3 media storage
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
    # "allauth.account.middleware.AccountMiddleware", # REMOVED
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
AUTH_USER_MODEL = "users.User" # ESSENTIAL: Keep for custom User model and Admin
AUTH_PASSWORD_VALIDATORS = [ # Keep, applies to all users including Admin
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend", # ESSENTIAL: Keep for Django Admin login
    # "allauth.account.auth_backends.AuthenticationBackend", # REMOVED
)

SITE_ID = 1 # Keep, Site framework is a core Django app and can be useful

# --- AllAuth specific settings --- REMOVED ENTIRE BLOCK
# ACCOUNT_LOGIN_METHODS = ["email"]
# ACCOUNT_USERNAME_REQUIRED = False
# ACCOUNT_EMAIL_REQUIRED = True
# ACCOUNT_AUTHENTICATION_METHOD = "email"
# ACCOUNT_UNIQUE_EMAIL = True
# ACCOUNT_EMAIL_VERIFICATION = "optional"
# ACCOUNT_USER_MODEL_USERNAME_FIELD = None
# ACCOUNT_SIGNUP_FIELDS = ["email", "password"]

# LOGIN_REDIRECT_URL = "/" # Keep these for Django Admin post-login behavior
# LOGOUT_REDIRECT_URL = "/" # Keep these for Django Admin post-logout behavior

# --- Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

# --- Static & media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR.parent / "static",
]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR.parent / "mediafiles"

# --- DRF settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication", # ESSENTIAL: Keep for browsable API & Admin
        "rest_framework.authentication.TokenAuthentication", # Keep for general token auth (e.g., internal tools)
        # "dj_rest_auth.jwt_auth.JWTCookieAuthentication", # REMOVED
        "rest_framework_simplejwt.authentication.JWTAuthentication", # Keep for JWT validation, potentially useful for other APIs
        "oauth2_provider.contrib.rest_framework.OAuth2Authentication", # Keep if using Django OAuth Toolkit
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",), # Keep as default, will manage permissions per view
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer", # Useful for development
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema", # Keep for API docs
    "DEFAULT_PAGINATION_CLASS": "ecommerce.pagination.StandardResultsSetPagination", # Keep for product pagination
    "PAGE_SIZE": 10, # Keep for product pagination
}

# --- CORS/CSRF (Keep as these are general security and connectivity settings)
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

# --- Celery (Keep, used for async tasks like email, but email tasks themselves will be removed later)
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = True

# --- Email via Anymail/SendGrid (Keep for now, will remove completely in a later step)
ANYMAIL = {"SENDGRID_API_KEY": env("SENDGRID_API_KEY", default="")}
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@ltronix-shop.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=1025)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")

# AllAuth: disable username field if using custom User with only email - REMOVED this block as AllAuth is removed
# ACCOUNT_AUTHENTICATION_METHOD = "email"
# ACCOUNT_USER_MODEL_USERNAME_FIELD = None
# ACCOUNT_USERNAME_REQUIRED = False
# ACCOUNT_SIGNUP_FIELDS = ["email", "password"]

# --- dj-rest-auth / JWT - REMOVED ENTIRE BLOCK
# REST_AUTH = {
#     "USE_JWT": True,
#     "SESSION_LOGIN": True,
#     "JWT_AUTH_COOKIE": "my-app-jwt-access",
#     "JWT_AUTH_REFRESH_COOKIE": "my-app-jwt-refresh",
#     "USER_DETAILS_SERIALIZER": "users.serializers.UserDetailsSerializer",
#     "REGISTER_SERIALIZER": "users.serializers.CustomRegisterSerializer",
#     "PASSWORD_RESET_USE_SITECONTROL": True,
#     "PASSWORD_RESET_CONFIRM_URL": env(
#         "DJANGO_PASSWORD_RESET_CONFIRM_URL",
#         default="http://localhost:3000/auth/password-reset-confirm/{uid}/{token}"
#     ),
#     "OLD_PASSWORD_FIELD_ENABLED": True,
#     "GOOGLE_CLIENT_ID": env("GOOGLE_CLIENT_ID", default=""),
#     "GOOGLE_CLIENT_SECRET": env("GOOGLE_CLIENT_SECRET", default=""),
# }

# --- Simple JWT (Keep, as it's a generic JWT implementation and might be used for internal APIs)
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# --- Social Auth (Google via AllAuth) - REMOVED ENTIRE BLOCK
# SOCIALACCOUNT_PROVIDERS = {
#     "google": {
#         "APP": {
#             "client_id": env("GOOGLE_CLIENT_ID", default=""),
#             "secret": env("GOOGLE_CLIENT_SECRET", default=""),
#             "key": "",
#         },
#         "SCOPE": ["profile", "email"],
#         "AUTH_PARAMS": {"access_type": "offline"},
#     }
# }

# OAUTH2_PROVIDER (Keep, might be for internal API clients or future features not tied to public auth)
OAUTH2_PROVIDER = {
    "SCOPES": {
        "read": "Read scope",
        "write": "Write scope",
        "openid": "OpenID Connect scope",
        "profile": "User profile information",
        "email": "User email address",
    }
}

# --- M-Pesa (Keep for now, will remove completely in a later step)
MPESA_CONSUMER_KEY = env("MPESA_CONSUMER_KEY")
MPESA_CONSUMER_SECRET = env("MPESA_CONSUMER_SECRET")
MPESA_SHORTCODE = env("MPESA_SHORTCODE")
MPESA_PASSKEY = env("MPESA_PASSKEY")
MPESA_CALLBACK_URL = env("MPESA_CALLBACK_URL")
MPESA_ENV = env("MPESA_ENV", default="sandbox")

# --- Sentry (Keep for now, will remove in a later step)
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

LOGGING = { # Keep logging, but note allauth/sentry loggers will be unused
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
        "anymail": { # Keep for now, will remove with email system later
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "sentry_sdk": { # Keep for now, will remove with Sentry later
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        # "allauth": { # REMOVED
        #     "handlers": ["console"],
        #     "level": "INFO",
        #     "propagate": False,
        # },
    },
}
