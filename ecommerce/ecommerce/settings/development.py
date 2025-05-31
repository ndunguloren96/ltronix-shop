# ecommerce/ecommerce/settings/development.py
"""
Development Django settings for ecommerce project.
"""

from .base import * # Import all settings from base.py

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Development specific allowed hosts
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'man-fond-tortoise.ngrok-free.app']

# Database configuration for development
# Using PostgreSQL for development, specified in .env
DATABASES = {
'default': env.db('DATABASE_URL', default=f"postgresql://{env('DATABASE_USER')}:{env('DATABASE_PASSWORD')}@{env('DATABASE_HOST')}:{env('DATABASE_PORT')}/{env('DATABASE_NAME')}")
}


# Email backend for development (prints emails to console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Optional: If you use Django Debug Toolbar
# INSTALLED_APPS += [
#     'debug_toolbar',
# ]

# MIDDLEWARE += [
#     'debug_toolbar.middleware.DebugToolbarMiddleware',
# ]

# INTERNAL_IPS = [
#     '127.0.0.1',
# ]

# CORS settings for development (more permissive)
# These should generally be more restrictive in production
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000', # Your Next.js frontend
    'http://127.0.0.1:3000',
])

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[
    'http://localhost:3000', # Your Next.js frontend
    'http://127.0.0.1:3000',
])

# In development, CSRF cookie can be non-secure if not using HTTPS
CSRF_COOKIE_SECURE = False

# Password reset confirm URL for local development (matches Next.js dev server)
REST_AUTH['PASSWORD_RESET_CONFIRM_URL'] = env('DJANGO_PASSWORD_RESET_CONFIRM_URL', default='http://localhost:3000/auth/password-reset-confirm/{uid}/{token}')

# Social Auth Redirect URI for local development
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env('SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI', default='http://127.0.0.1:8000/api/auth/complete/google-oauth2/')
SOCIAL_AUTH_REDIRECT_IS_HTTPS = False # No HTTPS for local dev