# ecommerce/settings/production.py

from .base import *

# --- Debugging ---
# Disable debug mode for the production environment.
DEBUG = False

# --- Allowed Hosts ---
# This list contains the allowed hostnames for the production environment.
# It includes the domains for Render and Vercel, as well as localhost for health checks.
ALLOWED_HOSTS = ['ltronix-shop.onrender.com', '*.onrender.com', 'ltronix-shop.vercel.app', '*.vercel.app', 'localhost', '127.0.0.1']

# --- Database ---
# This setting configures the database for the production environment.
# It uses the `DATABASE_URL` environment variable to connect to a PostgreSQL database.
DATABASES = {"default": env.db("DATABASE_URL")}

# --- Email ---
# This section contains settings for sending emails in the production environment.
EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@yourdomain.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# --- Security ---
# This section contains security settings for the production environment.
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True)
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True)
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=True)

# This setting is required for Render.com deployment to correctly handle SSL.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# --- CORS & CSRF ---
# This section contains settings for Cross-Origin Resource Sharing (CORS) and Cross-Site Request Forgery (CSRF) protection in the production environment.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")

# --- Static files ---
# This setting configures the storage backend for static files in the production environment.
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# --- AWS S3 Media Storage ---
# This section contains settings for storing media files on AWS S3.
USE_S3 = env.bool("USE_S3", default=False)
if USE_S3:
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default=None)
    AWS_S3_CUSTOM_DOMAIN = env(
        "AWS_S3_CUSTOM_DOMAIN",
        default=f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
    )
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"

# --- REST + Social Auth ---
# This section contains settings for dj-rest-auth and social authentication in the production environment.
REST_AUTH["PASSWORD_RESET_CONFIRM_URL"] = env("DJANGO_PASSWORD_RESET_CONFIRM_URL")