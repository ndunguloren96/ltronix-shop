# ecommerce/ecommerce/settings/production.py
"""
Production Django settings for ecommerce project.
"""

from .base import * # Import all settings from base.py

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Allowed hosts in production (your actual domain names)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS') # Example: ['your-domain.com', 'www.your-domain.com']

# Database configuration for production (e.g., PostgreSQL with a proper URL)
DATABASES = {
    'default': env.db('DATABASE_URL')
}


# Email backend for production (e.g., SendGrid, Mailgun, SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST')
EMAIL_PORT = env.int('EMAIL_PORT')
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True) # Use TLS for security
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@yourdomain.com')
SERVER_EMAIL = DEFAULT_FROM_EMAIL


# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True) # Redirect HTTP to HTTPS
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True) # Send session cookies only over HTTPS
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True) # Send CSRF cookies only over HTTPS
SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000) # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True)
SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=True)

# CORS settings for production (more restrictive)
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS') # Example: ['https://your-frontend-domain.com']
CORS_ALLOW_CREDENTIALS = True # Still allow credentials for session/token based auth

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS') # Example: ['https://your-frontend-domain.com']


# Static files storage for production (e.g., WhiteNoise)
# Ensure `whitenoise.middleware.WhiteNoiseMiddleware` is in MIDDLEWARE
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Password reset confirm URL for production (matches Next.js production domain)
REST_AUTH['PASSWORD_RESET_CONFIRM_URL'] = env('DJANGO_PASSWORD_RESET_CONFIRM_URL') # Example: 'https://your-frontend-domain.com/auth/password-reset-confirm/{uid}/{token}'

# Social Auth Redirect URI for production
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env('SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI')
SOCIAL_AUTH_REDIRECT_IS_HTTPS = True # Must be True for production with HTTPS