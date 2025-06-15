# ecommerce/ecommerce/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from payment.views import mpesa_stk_push_callback
from users.views import CustomRegisterView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
    path('payment/', include('payment.urls')),
    path('mpesa/stk_push_callback/', mpesa_stk_push_callback, name='mpesa_callback_root'),

    # ─── Consolidated API v1 ───────────────────────────────────────────────────────
    path('api/v1/', include([
        # Public store endpoints
        path('', include('store.api_urls')),  # products, orders, etc.

        # Authentication via dj-rest-auth
        path('auth/', include('dj_rest_auth.urls')),               # login, logout, password
        path('auth/signup/', CustomRegisterView.as_view(), name='rest_register'),
        
        # Social‑token conversion endpoint (drf-social-oauth2)
        path('auth/', include('drf_social_oauth2.urls', namespace='drf_social_oauth2')),

        # Payment API
        path('payments/', include('payment.api_urls')),
    ])),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
