"""
Production Django settings for ecommerce project.
"""

from .base import *

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")

DATABASES = {"default": env.db("DATABASE_URL")}

# Use Anymail/SendGrid for production email
EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@yourdomain.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True)
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool(
    "SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True
)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=True)

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# AWS S3 Media Storage
AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME') # e.g., 'us-east-1'
AWS_S3_CUSTOM_DOMAIN = env('AWS_S3_CUSTOM_DOMAIN', default=f'{env('AWS_STORAGE_BUCKET_NAME')}.s3.amazonaws.com')
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None # Or 'public-read' if files should be publicly accessible

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'


REST_AUTH["PASSWORD_RESET_CONFIRM_URL"] = env("DJANGO_PASSWORD_RESET_CONFIRM_URL")
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = env("SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI")
SOCIAL_AUTH_REDIRECT_IS_HTTPS = True
