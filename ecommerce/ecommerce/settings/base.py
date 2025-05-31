# ecommerce/ecommerce/settings/base.py
"""
Base Django settings for ecommerce project.
"""

from pathlib import Path
import os
from environ import Env # Import Env for environment variable management

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize django-environ
env = Env() # <--- 'env' is defined here
# Read environment variables from .env file. Adjust path as needed.
# Assumes .env is in the project root: ltronix-shop/ecommerce/.env
env.read_env(os.path.join(BASE_DIR.parent, '.env'))


# --- ADD THESE PRINT STATEMENTS FOR DEBUGGING (PLACED AFTER env = Env() AND env.read_env()) ---
print(f"DEBUG: Attempting to load .env from: {os.path.join(BASE_DIR.parent, '.env')}")
print(f"DEBUG: DJANGO_SECRET_KEY: {env('DJANGO_SECRET_KEY', default='NOT_SET')}")
print(f"DEBUG: DATABASE_URL: {env('DATABASE_URL', default='NOT_SET')}")
print(f"DEBUG: DATABASE_ENGINE (individual): {env('DATABASE_ENGINE', default='NOT_SET')}")
# --- END DEBUG STATEMENTS ---


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Fetch SECRET_KEY from environment variables for security
SECRET_KEY = env('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG is set in development.py and production.py
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
'allauth',
'allauth.account',
'allauth.socialaccount',
'allauth.socialaccount.providers.google', # This is correct for social logins

'dj_rest_auth',
'dj_rest_auth.registration',

'rest_framework',
'rest_framework.authtoken',

'oauth2_provider',
'social_django',
'drf_social_oauth2',

"store.apps.StoreConfig",
"payment",
"django_daraja",
"users",
"corsheaders",
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

TIME_ZONE = 'Africa/Nairobi' # Set to your local timezone

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') # Collect static files here for deployment

# Media files (user-uploaded files)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- Custom User Model ---
AUTH_USER_MODEL = 'users.User' # Point to your custom User model


# --- Django REST Framework (DRF) Settings ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Session authentication for browsable API and admin
        # 'rest_framework.authentication.SessionAuthentication',
        # Token authentication (if using simple tokens for mobile/frontend)
        # 'rest_framework.authentication.TokenAuthentication',
        # OAuth2 authentication (for drf-social-oauth2)
        # 'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
        # 'rest_framework_social_oauth2.authentication.SocialAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Require authentication by default
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
        'rest_framework.throttling.UserRateThrottle'
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day', # Anonymous users
        'user': '1000/day' # Authenticated users
    },
}

# --- CORS Headers Settings ---
CORS_ALLOW_ALL_ORIGINS = False # Set to False for production
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:3000'])
CORS_ALLOW_CREDENTIALS = True # Allow cookies to be sent with cross-origin requests

# Optional: You can also specify allowed methods and headers if needed
# CORS_ALLOW_METHODS = [
#     "DELETE",
#     "GET",
#     "OPTIONS",
#     "PATCH",
#     "POST",
#     "PUT",
# ]
# CORS_ALLOW_HEADERS = [
#     "accept",
#     "accept-encoding",
#     "authorization",
#     "content-type",
#     "dnt",
#     "origin",
#     "user-agent",
#     "x-csrftoken",
#     "x-requested-with",
# ]


# --- CSRF Settings ---
# CSRF_TRUSTED_ORIGINS is crucial for allowing AJAX POST requests from your frontend
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=['http://localhost:3000'])
# Ensure CSRF cookie is sent over HTTP-only (for security) and secure (for HTTPS)
CSRF_COOKIE_HTTPONLY = True # Recommended
CSRF_COOKIE_SECURE = False # Should be True in production (HTTPS)
CSRF_COOKIE_SAMESITE = 'Lax' # Recommended for most cases


# --- Django AllAuth Settings ---
SITE_ID = 1 # Required for django-allauth

# Specify authentication backend
AUTHENTICATION_BACKENDS = (
    # Django AllAuth specific authentication methods
    'allauth.account.auth_backends.AuthenticationBackend',
    # Python Social Auth backends for social login
    'social_core.backends.google.GoogleOAuth2', # Google OAuth2 backend
    # drf-social-oauth2 backend for DRF OAuth2 token conversion
    'drf_social_oauth2.backends.DjangoOAuth2',
    # Django's default authentication backend (for admin, etc.)
    'django.contrib.auth.backends.ModelBackend',
)

# AllAuth account settings
ACCOUNT_AUTHENTICATION_METHOD = 'email' # Users log in with email
ACCOUNT_EMAIL_REQUIRED = True # Email is mandatory
ACCOUNT_USERNAME_REQUIRED = False # No username, email is primary identifier
ACCOUNT_SIGNUP_EMAIL_ENTER_IF_REQUIRED = False # Don't force email entry if not required (but we require it)
ACCOUNT_UNIQUE_EMAIL = True # Ensure emails are unique
ACCOUNT_EMAIL_VERIFICATION = 'optional' # Email verification is required
ACCOUNT_CONFIRM_EMAIL_ON_GET = True # Confirm email when confirmation link is visited
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True # Log in after email confirmation
ACCOUNT_LOGIN_ATTEMPTS_LIMIT = 5 # Limit login attempts
ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT = 300 # Timeout for login attempts in seconds (5 minutes)
ACCOUNT_LOGOUT_ON_PASSWORD_CHANGE = True # Log out all sessions on password change
ACCOUNT_EMAIL_SUBJECT_PREFIX = '[Ltronix-Shop]' # Email subject prefix

# Redirect after login/logout
LOGIN_REDIRECT_URL = '/' # Not used directly by DRF, but good practice
LOGOUT_REDIRECT_URL = '/' # Not used directly by DRF, but good practice
ACCOUNT_LOGOUT_REDIRECT_URL = '/' # AllAuth specific logout redirect

# --- Email Settings for AllAuth ---
# In development, use console backend or Mailhog/Mailpit
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@ltronix-shop.com' # Your application's email address
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=1025) # Default MailHog/Mailpit SMTP port
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
SERVER_EMAIL = DEFAULT_FROM_EMAIL # Email for server errors

# --- dj-rest-auth Settings ---
# If you want to use TokenAuthentication instead of SessionAuthentication by default
# REST_USE_JWT = True # Set to True if using JWT (drf_simplejwt)
# For this setup with NextAuth.js, we expect dj-rest-auth to handle sessions (for admin)
# and also optionally generate a token for NextAuth if configured.
# NextAuth.js will handle its own session state.
REST_AUTH = {
    'USE_JWT': False, # We're not using JWT from dj-rest-auth directly for frontend. NextAuth handles JWT.
    'SESSION_LOGIN': True, # Enable session login for the browsable API/admin
    'LOGIN_SERIALIZER': 'dj_rest_auth.serializers.LoginSerializer',
    'TOKEN_MODEL': None, # Set to None if not using TokenAuthentication or if using JWT.
                         # If you still want a token for your frontend to directly use (not via NextAuth),
                         # you might keep TokenAuthentication enabled and use TokenModel,
                         # but NextAuth setup generally means it manages tokens.
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserDetailsSerializer', # Point to your custom UserDetailsSerializer
    'REGISTER_SERIALIZER': 'users.serializers.CustomRegisterSerializer', # Point to your custom RegisterSerializer
    'PASSWORD_RESET_USE_SITECONTROL': True, # Uses site.url to build reset links
    'PASSWORD_RESET_CONFIRM_URL': 'http://localhost:3000/auth/password-reset-confirm/{uid}/{token}', # Important! Frontend URL
    # Adjust for production: 'https://your-frontend-domain.com/auth/password-reset-confirm/{uid}/{token}'
    'OLD_PASSWORD_FIELD_ENABLED': True, # Enable old password check for password change
}

# --- Python Social Auth and drf-social-oauth2 Settings ---
# Google OAuth2 credentials
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY') # Google Client ID
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET') # Google Client Secret

# Specify additional scopes for Google OAuth2 if needed
# Example: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/user.birthday.read']
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['openid', 'email', 'profile']

# Redirect URI for social login.
# For local development, this usually matches the redirect URI configured in Google Cloud Console.
# Example: http://localhost:8000/api/auth/complete/google-oauth2/
# However, for drf-social-oauth2's convert-token flow, the redirect happens
# from Google to NextAuth, and then NextAuth sends the Google token to Django.
# So, this is less critical for the `convert-token` flow.
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env('SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI', default='http://127.0.0.1:8000/api/auth/complete/google-oauth2/')


# Set True for https if your site is secure (production)
SOCIAL_AUTH_REDIRECT_IS_HTTPS = env.bool('SOCIAL_AUTH_REDIRECT_IS_HTTPS', default=False)

# This setting ensures allauth integrates with social_django for user creation/association.
# When a user signs in via social, allauth automatically creates a local user account.
SOCIALACCOUNT_ADAPTER = 'allauth.socialaccount.adapter.DefaultSocialAccountAdapter'

# If you use the 'convert-token' endpoint, you might need to configure OAuth2 Provider
# OAuth2_PROVIDER_APPLICATION_MODEL = 'oauth2_provider.models.Application'
# OAuth2_PROVIDER = {
#     'SCOPES': {
#         'read': 'Read scope',
#         'write': 'Write scope',
#         'openid': 'OpenID Connect scope',
#         'profile': 'User profile information',
#         'email': 'User email address',
#     }
# }