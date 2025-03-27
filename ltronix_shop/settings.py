# ...existing code...
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "ltronix_db",
        "USER": "your_username",
        "PASSWORD": "your_password",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

AUTH_USER_MODEL = "core.CustomUser"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
# ...existing code...
