from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from payment.views import mpesa_stk_push_callback
from users.views import CustomRegisterView
from dj_rest_auth.views import LoginView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
    path('payment/', include('payment.urls')),
    path('mpesa/stk_push_callback/', mpesa_stk_push_callback, name='mpesa_callback_root'),

    path('api/auth/signin', LoginView.as_view(), name='rest_login'),

    path('api/v1/', include([
        path('', include('store.api_urls')),      # /api/v1/products/, /api/v1/orders/
        path('payments/', include('payment.api_urls')),  # /api/v1/payments/stk-push/
        path('auth/', include('dj_rest_auth.urls')),
        path('auth/signup/', CustomRegisterView.as_view(), name='rest_register'),
        path('auth/', include('drf_social_oauth2.urls', namespace='drf_social_oauth2')),
        path('', include('store.api_urls')),
    ])),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)