# ecommerce/ecommerce/urls.py

"""
URL configuration for ecommerce project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from payment.views import mpesa_stk_push_callback
from users.views import CustomRegisterView # Import your custom register view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')), # Frontend-facing URLs for store, e.g., product detail pages
    path('payment/', include('payment.urls')), # Frontend-facing URLs for payment

    # Mpesa callback URL (ensure this is configured correctly on Mpesa dashboard)
    path('mpesa/stk_push_callback/', mpesa_stk_push_callback, name='mpesa_callback_root'),

    # --- Consolidated API v1 Endpoints ---
    # All API endpoints for v1 will be prefixed with /api/v1/
    path('api/v1/', include([
        # Authentication API endpoints
        # These come from dj-rest-auth.urls for login, logout, password reset, etc.
        path('auth/', include('dj_rest_auth.urls')),
        # Custom registration endpoint specifically for email/password signup
        path('auth/signup/', CustomRegisterView.as_view(), name='rest_register'),
        # Social token conversion endpoint (drf-social-oauth2)
        path('auth/', include('drf_social_oauth2.urls', namespace='drf_social_oauth2')),
        # You might also need allauth's own URLs for email confirmation, etc.
        # These are typically not API endpoints but Django views that handle redirects.
        # path('auth/account/', include('allauth.account.urls')),

        # Store API endpoints (e.g., products list, product detail, categories, etc.)
        # Ensure 'store.api_urls' contains only endpoints relevant to the store API
        path('products/', include('store.api_urls')),

        # Payment API endpoints
        # Ensure 'payment.api_urls' contains only endpoints relevant to payment API
        path('payments/', include('payment.api_urls')),
    ])),
    # --- End Consolidated API v1 ---
]

# Serve media files in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
