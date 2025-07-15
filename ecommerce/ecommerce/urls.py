# ecommerce/ecommerce/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path # Import re_path for dj_rest_auth social urls

# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import your custom views from the users app
from users.views import (
    CustomRegisterView,
    EmailChangeView,
    AccountDeleteView,
)

from dj_rest_auth.views import PasswordChangeView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API base path
    path("api/v1/", include([
        path("store/", include("store.api_urls")), # Assuming store.api_urls defines product/cart endpoints
        path("payments/", include("payment.api_urls")), # Corrected from "payment/" to "payments/" for consistency
        # dj-rest-auth URLs
        path("auth/", include("dj_rest_auth.urls")), # Login, Logout, User details, Password Reset/Change
        path("auth/registration/", include("dj_rest_auth.registration.urls")), # Default registration endpoints
        # FIX: Explicitly include your CustomRegisterView if it's not handled by dj_rest_auth.registration.urls
        # If CustomRegisterView is meant to replace dj_rest_auth's default, this is correct.
        # Otherwise, if it's an *additional* registration method, adjust the path.
        # Assuming your CustomRegisterView is at /api/v1/auth/registration/
        # and it handles the full registration process including token generation.
        # If dj_rest_auth.registration.urls is also used, this specific path will override it.
        path("auth/registration/", CustomRegisterView.as_view(), name="rest_register"),
        
        # dj-rest-auth social login URLs (for Google via AllAuth)
        # These are usually handled by dj_rest_auth.urls and allauth.urls combined.
        # No need to explicitly define /auth/google/ or /auth/google/connect/ here
        # as dj_rest_auth.urls handles social login endpoints when allauth is installed.
        
        # AllAuth URLs (crucial for social login callbacks from Google)
        # This needs to be accessible for Google to redirect to, usually under /accounts/
        path("accounts/", include("allauth.urls")),

        # Custom user-related views
        path("auth/password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
        path("auth/email/change/", EmailChangeView.as_view(), name="rest_email_change"),
        path("auth/account/delete/", AccountDeleteView.as_view(), name="rest_account_delete"),

        # Schema and Swagger UI
        path("schema/", include("drf_spectacular.urls")), # Simpler way to include Spectacular URLs
    ])),
    # Direct URL for M-Pesa STK Push Confirmation Callback (webhook)
    path(
        "mpesa/stk_push_callback/",
        mpesa_stk_push_callback,
        name="mpesa_stk_push_callback",
    ),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


