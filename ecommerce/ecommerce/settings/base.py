"""
Base Django settings for ecommerce project.
"""

from pathlib import Path
import os
from environ import Env
from django.utils import timezone # Import timezone for default values in migrations
from datetime import timedelta # Import timedelta for JWT settings

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize django-environ
env = Env()
# Read environment variables from .env file.
env.read_env(os.path.join(BASE_DIR.parent, '.env'))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False # Default to False, overridden by specific settings files

ALLOWED_HOSTS = [] # Overridden by specific settings files


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'django.contrib.sites',

    # AllAuth for authentication
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

    # DRF and authentication related
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt', 

    # OAuth2 and social login integration
    'oauth2_provider', # Django OAuth Toolkit
    'social_django', # Python Social Auth core
    'drf_social_oauth2', # drf-social-oauth2

    # Your custom apps
    "store.apps.StoreConfig", 
    "payment",
    "django_daraja", 
    "users", # Your custom user app

    # CORS Headers
    "corsheaders",

    # Django Spectacular for API documentation
    'drf_spectacular',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware', 
]

ROOT_URLCONF = 'ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], 
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request', 
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends', 
                'social_django.context_processors.login_redirect', 
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce.wsgi.application'


# Database
# Defined in development.py and production.py
DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3') 
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8, 
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
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR.parent, 'mediafiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'


# DRF: enable token, session, OAuth2 & social auth
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication', 
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication', 
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
        'rest_framework_social_oauth2.authentication.SocialAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny', 
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ---- CORS CONFIGURATION ----
from corsheaders.defaults import default_headers

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:3000'])
# Explicitly allow standard HTTP methods for CORS
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_CREDENTIALS = True

# --- CRITICAL FIX: Allow X-Session-Key header for guest carts ---
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-session-key",
]

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=['http://localhost:3000'])
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'

SITE_ID = 1

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
    'social_core.backends.google.GoogleOAuth2',
    'drf_social_oauth2.backends.DjangoOAuth2',
)

# --- AllAuth configuration (Crucial for email-based login) ---
ACCOUNT_AUTHENTICATION_METHOD = 'email' # Authenticate using email
ACCOUNT_EMAIL_REQUIRED = True # Email is a required field
ACCOUNT_USERNAME_REQUIRED = False # Disable username field
ACCOUNT_SIGNUP_PASSWORD_ENTER_TWICE = True # Require password confirmation on signup
ACCOUNT_SESSION_REMEMBER = True # Keep user logged in across browser sessions
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = 'optional' # Changed from 'mandatory' for simpler dev setup
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
ACCOUNT_LOGOUT_ON_PASSWORD_CHANGE = True
ACCOUNT_EMAIL_SUBJECT_PREFIX = '[Ltronix-Shop]'
ACCOUNT_LOGIN_METHODS = ['email'] # Redundant with ACCOUNT_AUTHENTICATION_METHOD but good for clarity
ACCOUNT_SIGNUP_FIELDS = ['email'] # Specify fields for signup
ACCOUNT_RATE_LIMITS = {'login_failed': '5/5m'}
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'
# --- End AllAuth configuration ---


EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = 'noreply@ltronix-shop.com'
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=1025)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

# dj-rest-auth settings for JWT (if you uncommented JWT in base.py)
REST_AUTH = {
    'USE_JWT': True, 
    'SESSION_LOGIN': True,
    'TOKEN_MODEL': None, 
    'JWT_AUTH_COOKIE': 'my-app-jwt-access', 
    'JWT_AUTH_REFRESH_COOKIE': 'my-app-jwt-refresh', 
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserDetailsSerializer',
    'REGISTER_SERIALIZER': 'users.serializers.CustomRegisterSerializer',
    'PASSWORD_RESET_USE_SITECONTROL': True,
    'PASSWORD_RESET_CONFIRM_URL': env(
        'DJANGO_PASSWORD_RESET_CONFIRM_URL',
        default='http://localhost:3000/auth/password-reset-confirm/{uid}/{token}'
    ),
    'OLD_PASSWORD_FIELD_ENABLED': True,
}

# SIMPLE_JWT settings (must be configured if USE_JWT is True in REST_AUTH)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5), 
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1), 
    'ROTATE_REFRESH_TOKENS': True, 
    'BLACKLIST_AFTER_ROTATION': True, 
    'UPDATE_LAST_LOGIN': False, # Corrected: Removed leading extra quote

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',), 
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}


SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET')
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['openid', 'email', 'profile']
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env(
    'SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI',
    default='http://127.0.0.1:8000/api/v1/auth/convert-token/'
)
SOCIAL_AUTH_REDIRECT_IS_HTTPS = env.bool('SOCIAL_AUTH_REDIRECT_IS_HTTPS', default=False)

OAUTH2_PROVIDER = {
    'SCOPES': {
        'read': 'Read scope',
        'write': 'Write scope',
        'openid': 'OpenID Connect scope',
        'profile': 'User profile information',
        'email': 'User email address',
    }
}

# django-daraja settings (Crucial for M-Pesa integration)
MPESA_CONSUMER_KEY = env('MPESA_CONSUMER_KEY')
MPESA_CONSUMER_SECRET = env('MPESA_CONSUMER_SECRET')
MPESA_SHORTCODE = env('MPESA_SHORTCODE')
MPESA_PASSKEY = env('MPESA_PASSKEY')
MPESA_CALLBACK_URL = env('MPESA_CALLBACK_URL') 
MPESA_ENV = env('MPESA_ENV', default='sandbox') 
