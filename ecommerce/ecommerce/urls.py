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

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path("admin/", admin.site.urls),
    # API base path
    path("api/v1/", include([
        path("store/", include("store.api_urls")), # Assuming store.api_urls defines product/cart endpoints
        path("payments/", include("payment.api_urls")), # Corrected from "payment/" to "payments/" for consistency
        # dj-rest-auth URLs
        path("auth/", include("dj_rest_auth.urls")), # Login, Logout, User details, Password Reset/Change
        path("auth/registration/", include("dj_rest_auth.registration.urls")), # Default registration endpoints
        # Explicitly include your CustomRegisterView if it's not handled by dj_rest_auth.registration.urls
        path("auth/registration/", CustomRegisterView.as_view(), name="rest_register"),
        
        # AllAuth URLs (crucial for social login callbacks from Google)
        # This needs to be accessible for Google to redirect to, usually under /accounts/
        path("accounts/", include("allauth.urls")),

        # Custom user-related views
        path("auth/password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
        path("auth/email/change/", EmailChangeView.as_view(), name="rest_email_change"),
        path("auth/account/delete/", AccountDeleteView.as_view(), name="rest_account_delete"),

        # Schema and Swagger UI - FIX: Use direct views from drf_spectacular
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        path("schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
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


