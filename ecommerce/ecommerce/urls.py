# ecommerce/ecommerce/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Define a list of your project's API URL patterns
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

# The main project URL patterns
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

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
