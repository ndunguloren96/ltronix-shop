# ecommerce/ecommerce/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from payment.views import mpesa_stk_push_callback
from users.views import CustomRegisterView # Keep this for email/password registration

# Import dj-rest-auth's social views directly (removed GoogleLogin as it's not used in this flow)
# from dj_rest_auth.registration.views import SocialLoginView
# from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
# from allauth.socialaccount.providers.oauth2.client import OAuth2Client

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path('admin/', admin.site.urls),
    # Base paths from 0adfa872
    path('', include('store.urls')),
    path('payment/', include('payment.urls')),
    path('mpesa/stk_push_callback/', mpesa_stk_push_callback, name='mpesa_callback_root'),

    # ─── Consolidated API v1 ───────────────────────────────────────────────────────
    path('api/v1/', include([
        # Public store endpoints
        path('', include('store.api_urls')),  # products, orders, etc.

        # Authentication via dj-rest-auth (kept for email/password login/registration)
        path('auth/', include('dj_rest_auth.urls')),  # login, logout, password reset/change
        path('auth/signup/', CustomRegisterView.as_view(), name='rest_register'), # For custom registration

        # Social-token conversion endpoint (drf-social-oauth2) - CRITICAL FOR GOOGLE AUTH
        path('auth/', include('drf_social_oauth2.urls', namespace='drf_social_oauth2')),

        # Payment API
        path('payments/', include('payment.api_urls')),

        # Schema and Swagger UI (kept from current)
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        path("schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ])),
]

# Serve static and media files in development (kept from current)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

