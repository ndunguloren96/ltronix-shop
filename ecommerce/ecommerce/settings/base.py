# ecommerce/settings/base.py

import os
import warnings
from datetime import timedelta
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

# Suppress dj_rest_auth deprecation warnings
warnings.filterwarnings(
    "ignore",
    message=r"app_settings\.(USERNAME|EMAIL)_REQUIRED is deprecated",
    module="dj_rest_auth.registration.serializers",
)
# Suppress the specific ACCOUNT_AUTHENTICATION_METHOD warning
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


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False  # Default to False, overridden by specific settings files

# FIX: Make ALLOWED_HOSTS more robust with deployed domains as defaults
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1', 'ltronix-shop.vercel.app', 'ltronix-shop.onrender.com'])


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # AllAuth for authentication (kept for email/password and general account management)
    'allauth',
    'allauth.account',
    'allauth.socialaccount', # Keep this for generic social account management

    # DRF and authentication related
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt', # Kept for JWT support

    # OAuth2 and social login integration (from 0adfa872)
    'oauth2_provider', # Django OAuth Toolkit
    'social_django', # Python Social Auth core
    'drf_social_oauth2', # drf-social-oauth2

    # Django Spectacular for API documentation
    'drf_spectacular',
    "anymail", # Kept for email sending

    # Your custom apps
    "store.apps.StoreConfig",
    "payment",
    "django_daraja",
    "users", # Your custom user app
    "emails", # Kept
    "storages", # Kept
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # For serving static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Must be placed high up
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware', # For django-allauth
]

ROOT_URLCONF = 'ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Add a templates directory if you have custom templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request', # Required for allauth
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends', # For social_django
                'social_django.context_processors.login_redirect', # For social_django
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce.wsgi.application'


# Database
# Defined in development.py and production.py
DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3') # Default to SQLite for safety
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8, # Ensure minimum password length is 8
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    BASE_DIR.parent / "static", # Use Path object for project-level static files
]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage" # Kept

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR.parent, 'mediafiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'


# --- DRF: enable token, session, OAuth2 & social auth (merged from 0adfa872 and current) ───────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication', # Kept for general token use
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication', # Kept for dj-rest-auth JWTs
        'rest_framework_simplejwt.authentication.JWTAuthentication', # Kept for general JWT validation
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication', # For Django OAuth Toolkit
        'rest_framework_social_oauth2.authentication.SocialAuthentication', # For drf-social-oauth2
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Consider changing to AllowAny for public endpoints
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': ( # From 0adfa872, good to keep
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
    'DEFAULT_THROTTLE_CLASSES': ( # From 0adfa872, good to keep
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': { # From 0adfa872, good to keep
        'anon': '100/day',
        'user': '1000/day',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema', # Kept
    'DEFAULT_PAGINATION_CLASS': "ecommerce.pagination.StandardResultsSetPagination", # Kept
    "PAGE_SIZE": 10, # Kept
}


# --- CORS/CSRF (merged from current)
from corsheaders.defaults import default_headers

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000", "https://ltronix-shop.vercel.app", "https://ltronix-shop.onrender.com"])
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["x-session-key"]

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000", "https://ltronix-shop.vercel.app", "https://ltronix-shop.onrender.com"])
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True) # Kept current setting
CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True) # Kept current setting
SESSION_COOKIE_SAMESITE = "Lax"

SITE_ID = 1

# --- AllAuth specific settings (merged from 0adfa872 and current) ---
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = 'none' # Changed from 'optional' to 'none' as per current codebase
ACCOUNT_CONFIRM_EMAIL_ON_GET = True # From 0adfa872
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True # From 0adfa872
ACCOUNT_LOGOUT_ON_PASSWORD_CHANGE = True # From 0adfa872
ACCOUNT_EMAIL_SUBJECT_PREFIX = '[Ltronix-Shop]' # From 0adfa872
ACCOUNT_LOGIN_METHODS = ['email'] # Kept current setting
ACCOUNT_SIGNUP_FIELDS = ['email'] # Kept current setting
ACCOUNT_RATE_LIMITS = {'login_failed': '5/5m'} # From 0adfa872
ACCOUNT_USER_MODEL_USERNAME_FIELD = None # Kept current setting
ACCOUNT_USERNAME_REQUIRED = False # Kept current setting

# --- CRUCIAL: REMOVE SOCIALACCOUNT_ADAPTER as it's not used by drf_social_oauth2 flow
# SOCIALACCOUNT_ADAPTER = "users.adapters.DebugSocialAccountAdapter" # REMOVE THIS LINE


LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# --- Email (merged from current)
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@ltronix-shop.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=1025)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
ANYMAIL = {"SENDGRID_API_KEY": env("SENDGRID_API_KEY", default="")}


# --- dj-rest-auth (merged from 0adfa872 and current) ───────────────────
REST_AUTH = {
    'USE_JWT': True, # Kept current setting (True) for dj-rest-auth's own login/registration
    'SESSION_LOGIN': True,
    'JWT_AUTH_COOKIE': "my-app-jwt-access", # Kept current setting
    'JWT_AUTH_REFRESH_COOKIE': "my-app-jwt-refresh", # Kept current setting
    'JWT_AUTH_HTTPONLY': False, # Kept current setting
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserDetailsSerializer',
    'REGISTER_SERIALIZER': 'users.serializers.CustomRegisterSerializer',
    'PASSWORD_RESET_USE_SITECONTROL': True,
    'PASSWORD_RESET_CONFIRM_URL': env(
        'DJANGO_PASSWORD_RESET_CONFIRM_URL',
        default='https://ltronix-shop.vercel.app/auth/password-reset-confirm/{uid}/{token}' # Updated to current frontend URL
    ),
    'OLD_PASSWORD_FIELD_ENABLED': True,
    # GOOGLE_CLIENT_ID/SECRET are NOT used here for drf-social-oauth2 flow
    # 'GOOGLE_CLIENT_ID': env("GOOGLE_CLIENT_ID", default=""),
    # 'GOOGLE_CLIENT_SECRET': env("GOOGLE_CLIENT_SECRET", default=""),
}

# --- Simple JWT (kept current settings)
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

# --- Social Auth (Google via Python Social Auth / drf-social-oauth2) ---
# These are the credentials for Python Social Auth to talk to Google
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env('GOOGLE_CLIENT_ID') # Use GOOGLE_CLIENT_ID for key
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env('GOOGLE_CLIENT_SECRET') # Use GOOGLE_CLIENT_SECRET for secret
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['openid', 'email', 'profile'] # Ensure these scopes are requested
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env(
    'SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI',
    # This URL is the backend endpoint that receives the code from Google
    # It must be an authorized redirect URI in your Google Cloud Console
    default='http://127.0.0.1:8000/api/v1/auth/convert-token/'
)
SOCIAL_AUTH_REDIRECT_IS_HTTPS = env.bool('SOCIAL_AUTH_REDIRECT_IS_HTTPS', default=False) # Set to True in production

# --- Django OAuth Toolkit settings (kept current settings)
OAUTH2_PROVIDER = {
    'SCOPES': {
        'read': 'Read scope',
        'write': 'Write scope',
        'openid': 'OpenID Connect scope',
        'profile': 'User profile information',
        'email': 'User email address',
    }
}

# --- M-Pesa (kept current settings)
MPESA_CONSUMER_KEY = env("MPESA_CONSUMER_KEY")
MPESA_CONSUMER_SECRET = env("MPESA_CONSUMER_SECRET")
MPESA_SHORTCODE = env("MPESA_SHORTCODE")
MPESA_PASSKEY = env("MPESA_PASSKEY")
MPESA_CALLBACK_URL = env("MPESA_CALLBACK_URL")
MPESA_ENV = env("MPESA_ENV", default="sandbox")

# --- Sentry (kept current settings)
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

# --- Logging (kept current settings)
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
        "allauth": { # Kept allauth logger
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "social_core": { # Add logger for social_core
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "drf_social_oauth2": { # Add logger for drf_social_oauth2
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

