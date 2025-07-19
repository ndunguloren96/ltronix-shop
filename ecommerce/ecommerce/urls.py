# ecommerce/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# Import necessary allauth and dj_rest_auth views and adapters
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

# Import your custom register serializer
from users.serializers import CustomRegisterSerializer

# Define a custom GoogleLogin view to integrate with dj-rest-auth
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    # Ensure this callback_url matches one of the Authorized redirect URIs in your Google API Console
    # and is also correctly configured in settings.SOCIALACCOUNT_PROVIDERS
    callback_url = settings.SOCIALACCOUNT_PROVIDERS['google']['AUTH_PARAMS']['redirect_uri']
    
    def post(self, request, *args, **kwargs):
        # DEBUG: Print the callback_url being used by this view
        print(f"DEBUG: GoogleLogin View - using callback_url: {self.callback_url}")
        return super().post(request, *args, **kwargs)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("djoser.urls")),
    path("api/v1/", include("djoser.urls.jwt")),
    path("api/v1/auth/", include("dj_rest_auth.urls")),
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/v1/auth/google/", GoogleLogin.as_view(), name="google_login"), # This is the endpoint NextAuth hits
    path("api/v1/orders/", include("payment.urls")), # Assuming payment app handles orders
    path("api/v1/store/", include("store.urls")), # Store app URLs
    path("api/v1/users/", include("users.urls")), # Users app URLs
    path("api/v1/emails/", include("emails.urls")), # Emails app URLs
    
    # Swagger/OpenAPI documentation
    path("api/v1/schema/", include("drf_spectacular.urls")),
    path("api/v1/schema/swagger-ui/", include("drf_spectacular.urls")), # Removed name='swagger-ui'
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Custom registration serializer override
REST_AUTH_REGISTER_SERIALIZERS = {
    "REGISTER_SERIALIZER": CustomRegisterSerializer,
}

