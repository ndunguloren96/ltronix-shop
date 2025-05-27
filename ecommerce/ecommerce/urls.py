# ecommerce/ecommerce/urls.py

"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('home/', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from payment.views import mpesa_stk_push_callback
from users.views import CustomRegisterView # Import your custom register view
from dj_rest_auth.registration.views import SocialLoginView 


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
    path('payment/', include('payment.urls')),
    path('mpesa/stk_push_callback/', mpesa_stk_push_callback, name='mpesa_callback_root'),

    # --- API Versioning for Authentication ---
    path('api/v1/', include([
        # dj-rest-auth URLs for login, logout, user details, password reset etc.
        path('auth/', include('dj_rest_auth.urls')),
        # Custom signup view
        path('auth/signup/', CustomRegisterView.as_view(), name='rest_register'),

        # Social login endpoints (Google, etc.) and their callbacks are handled by:
        # This includes /api/v1/auth/accounts/google/login/callback/
        path('auth/accounts/', include('allauth.socialaccount.urls')),

        # Your dj-rest-auth social login endpoint
        path('auth/google/login/', SocialLoginView.as_view(), name='google_login'),

        # Other general API endpoints, you'd include them here.
    ])),
    # --- End API Versioning for Authentication ---
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)