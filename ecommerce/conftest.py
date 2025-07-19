import pytest
from django.conf import settings


def pytest_configure():
    settings.configure(
        INSTALLED_APPS=[
            "django.contrib.admin",
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.sessions",
            "django.contrib.messages",
            "django.contrib.staticfiles",
            "django.contrib.sites",
            "store",
            "users",
            "allauth",
            "allauth.account",
            "allauth.socialaccount",
            "dj_rest_auth",
            "dj_rest_auth.registration",
            "rest_framework",
            "rest_framework.authtoken",
            "rest_framework_simplejwt",
            "corsheaders",
            "drf_spectacular",
        ],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
        SECRET_KEY="a-very-secret-key",
        STATIC_URL="/static/",
        MEDIA_URL="/media/",
        MEDIA_ROOT="/tmp/media/",
        AUTH_USER_MODEL="users.User",
        ROOT_URLCONF="ecommerce.urls",
        TEMPLATES=[
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "DIRS": [],
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": [
                        "django.template.context_processors.debug",
                        "django.template.context_processors.request",
                        "django.contrib.auth.context_processors.auth",
                        "django.contrib.messages.context_processors.messages",
                        "social_django.context_processors.backends",
                        "social_django.context_processors.login_redirect",
                    ],
                },
            },
        ],
        SITE_ID=1,
        MIDDLEWARE=[
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
            "allauth.account.middleware.AccountMiddleware",
        ],
        # AllAuth settings
        ACCOUNT_AUTHENTICATION_METHOD="email",
        ACCOUNT_EMAIL_REQUIRED=True,
        ACCOUNT_USERNAME_REQUIRED=False,
        ACCOUNT_SIGNUP_PASSWORD_ENTER_TWICE=True,
        ACCOUNT_SESSION_REMEMBER=True,
        ACCOUNT_UNIQUE_EMAIL=True,
        ACCOUNT_EMAIL_VERIFICATION="none",  # Set to none for testing
        ACCOUNT_CONFIRM_EMAIL_ON_GET=False,
        ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION=False,
        ACCOUNT_LOGOUT_ON_PASSWORD_CHANGE=False,
        ACCOUNT_EMAIL_SUBJECT_PREFIX="[Test Ltronix-Shop]",
        ACCOUNT_LOGIN_METHODS=["email"],
        ACCOUNT_SIGNUP_FIELDS=["email"],
        # Anymail settings for testing
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",  # Use in-memory backend for testing
        DEFAULT_FROM_EMAIL="test@ltronix-shop.com",
        SERVER_EMAIL="test@ltronix-shop.com",
        # DRF settings
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework.authentication.SessionAuthentication",
                "rest_framework.authentication.TokenAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
        },
        # Mpesa settings (dummy for tests)
        MPESA_CONSUMER_KEY="test_key",
        MPESA_CONSUMER_SECRET="test_secret",
        MPESA_SHORTCODE="600999",
        MPESA_PASSKEY="test_passkey",
        MPESA_CALLBACK_URL="http://test.com/callback",
        MPESA_ENV="sandbox",
    )
    # This is crucial for Django to pick up the settings
    import django

    django.setup()


@pytest.fixture(scope="function")
def db_access_without_rollback_and_truncate(django_db_setup, django_db_blocker):
    """
    Allows tests to access the database without rollback and truncate.
    Useful for debugging or specific test scenarios where you need to
    inspect the database state after a test.
    """
    with django_db_blocker.unblock():
        yield
