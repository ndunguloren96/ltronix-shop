# ecommerce/ecommerce/settings/base.py
"""
Base Django settings for ecommerce project.
"""

from pathlib import Path
import os
from environ import Env
from django.utils import timezone # Import timezone for default values in migrations

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

    # OAuth2 and social login integration
    'oauth2_provider', # Django OAuth Toolkit
    'social_django', # Python Social Auth core
    'drf_social_oauth2', # drf-social-oauth2

    # Your custom apps
    "store.apps.StoreConfig", # Ensure this is correct if your app is named 'store'
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
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR.parent, 'mediafiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'


# ‹FIX› ─── DRF: enable token, session, OAuth2 & social auth ───────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
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
# ‹END FIX›


CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:3000'])
CORS_ALLOW_CREDENTIALS = True

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


ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = 'optional'
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
ACCOUNT_LOGOUT_ON_PASSWORD_CHANGE = True
ACCOUNT_EMAIL_SUBJECT_PREFIX = '[Ltronix-Shop]'
ACCOUNT_LOGIN_METHODS = ['email']
ACCOUNT_SIGNUP_FIELDS = ['email']
ACCOUNT_RATE_LIMITS = {'login_failed': '5/5m'}
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = 'noreply@ltronix-shop.com'
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=1025)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

# ‹FIX› ─── dj-rest-auth: restore token model so /auth/login/ returns “key” ───────────
REST_AUTH = {
    'USE_JWT': False,               # We’ll rely on simple TokenAuthentication
    'SESSION_LOGIN': True,
    # 'TOKEN_MODEL': None,         # ← remove this override so default Token model is used
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserDetailsSerializer',
    'REGISTER_SERIALIZER': 'users.serializers.CustomRegisterSerializer',
    'PASSWORD_RESET_USE_SITECONTROL': True,
    'PASSWORD_RESET_CONFIRM_URL': env(
        'DJANGO_PASSWORD_RESET_CONFIRM_URL',
        default='http://localhost:3000/auth/password-reset-confirm/{uid}/{token}'
    ),
    'OLD_PASSWORD_FIELD_ENABLED': True,
}
# ‹END FIX›

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
