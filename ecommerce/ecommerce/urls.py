# ecommerce/ecommerce/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import your custom views from the users app
from users.views import EmailChangeView, AccountDeleteView
# from users.views import CustomRegisterView # Only uncomment if you need to explicitly map it here

from dj_rest_auth.views import PasswordChangeView

# Import dj-rest-auth's social views directly
from dj_rest_auth.registration.views import SocialLoginView # For social login
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter # Specific adapter for Google
from allauth.socialaccount.providers.oauth2.client import OAuth2Client # For OAuth2 client

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


# Custom GoogleLogin view to integrate with dj-rest-auth's SocialLoginView
# This is a common pattern when dj_rest_auth.social.urls is problematic or for more control.
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.SOCIALACCOUNT_PROVIDERS['google']['AUTH_PARAMS']['redirect_uri'] # Ensure this matches your Google API Console redirect URI
    client_class = OAuth2Client


urlpatterns = [
    path("admin/", admin.site.urls),
    # API base path
    path("api/v1/", include([
        path("", include("store.api_urls")),
        path("payments/", include("payment.api_urls")),
        path("seller/", include("sellers.api_urls")),

        # dj-rest-auth core URLs (login, logout, user details, password reset/change)
        path("auth/", include("dj_rest_auth.urls")),

        # dj-rest-auth registration URLs (email/password registration)
        path("auth/registration/", include("dj_rest_auth.registration.urls")),

        # --- CRUCIAL FIX FOR GOOGLE AUTHENTICATION ---
        # Explicitly map the Google social login view.
        # This creates the endpoint /api/v1/auth/google/ that the frontend should hit.
        path("auth/google/", GoogleLogin.as_view(), name="google_login"), # <--- This is the key change

        # AllAuth URLs (still needed for the initial OAuth flow and redirect from Google)
        path("accounts/", include("allauth.urls")),

        # Custom user-related views
        path("auth/password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
        path("auth/email/change/", EmailChangeView.as_view(), name="rest_email_change"),
        path("auth/account/delete/", AccountDeleteView.as_view(), name="rest_account_delete"),

        # Schema and Swagger UI
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

