# ecommerce/ecommerce/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# --- API URL Patterns ---
# This list contains all the URL patterns for the API.
# It includes the URLs for the store, payments, sellers, and authentication.
api_urlpatterns = [
    path("", include("store.api_urls")),
    path("payments/", include("payment.api_urls")),
    path("seller/", include("sellers.api_urls")),
    
    # NEW: Include all user and auth-related URLs from the users app
    path("auth/", include("users.urls")),
    
    # Schema and Swagger UI
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

# --- Main URL Patterns ---
# This is the main URL configuration for the project.
# It includes the admin URLs, the API URLs, and the M-Pesa callback URL.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_urlpatterns)),
    
    # Direct URL for M-Pesa STK Push Confirmation Callback (webhook)
    path(
        "mpesa/stk_push_callback/",
        mpesa_stk_push_callback,
        name="mpesa_stk_push_callback",
    ),
]

# --- Static and Media Files ---
# This section configures the serving of static and media files in development.
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)