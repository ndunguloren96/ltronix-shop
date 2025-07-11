# ecommerce/ecommerce/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import your custom views from the users app.
# Ensure all views you reference in urlpatterns that are defined in users.views
# are imported here.
from users.views import (
    CustomRegisterView,
    EmailChangeView,
    AccountDeleteView,
)
from dj_rest_auth.views import PasswordChangeView

urlpatterns = [
    path("admin/", admin.site.urls),
    # FIX: Changed 'api/v1/products/' to 'api/v1/' to avoid double 'products/' nesting
    # Now, products will be at /api/v1/products/ as defined in store/api_urls.py
    path("api/v1/", include("store.api_urls")),
    # API endpoints for payment (using api_urls for DRF views)
    path("api/v1/payments/", include("payment.api_urls")),
    # Direct URL for M-Pesa STK Push Confirmation Callback (webhook)
    path(
        "mpesa/stk_push_callback/",
        mpesa_stk_push_callback,
        name="mpesa_stk_push_callback",
    ),
    # For dj-rest-auth authentication endpoints (login, logout, user details, password change/reset)
    # This still includes the /auth/user/ endpoint which uses USER_DETAILS_SERIALIZER
    path("api/v1/auth/", include("dj_rest_auth.urls")),
    path("api/v1/auth/password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
    path("api/v1/auth/email/change/", EmailChangeView.as_view(), name="rest_email_change"),
    path("api/v1/auth/account/delete/", AccountDeleteView.as_view(), name="rest_account_delete"),
    # --- CRITICAL FIX: CUSTOM REGISTRATION ROUTE ---
    # Replace the problematic 'dj_rest_auth.registration.urls' include
    # with a direct path to your custom registration view.
    # This ensures dj_rest_auth.registration.serializers.RegisterSerializer is NEVER loaded by this path.
    path(
        "api/v1/auth/registration/", CustomRegisterView.as_view(), name="rest_register"
    ),
    # If you're using drf-social-oauth2 (this was commented out in your base.py, keeping it consistent)
    # path("api/v1/auth/social/", include("drf_social_oauth2.urls", namespace="drf")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
