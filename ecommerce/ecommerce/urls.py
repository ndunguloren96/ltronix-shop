# ecommerce/ecommerce/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import your custom views from the users app
from users.views import EmailChangeView, AccountDeleteView # Keep these if you use them
# from users.views import CustomRegisterView # Only uncomment if you need to explicitly map it here

from dj_rest_auth.views import PasswordChangeView

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# --- CRUCIAL FIX FOR GOOGLE AUTHENTICATION ---
# Explicitly import urlpatterns from dj_rest_auth.social.urls
# This ensures the module is found and its URL patterns are correctly loaded.
try:
    from dj_rest_auth.social.urls import urlpatterns as social_urlpatterns
except ImportError:
    # This block will only execute if dj_rest_auth.social.urls cannot be imported.
    # It's a fallback/debug measure, though it should ideally not be hit if dj_rest_auth
    # and allauth are correctly installed.
    # If this error persists, it might indicate a deeper installation issue with dj-rest-auth.
    print("WARNING: Could not import dj_rest_auth.social.urls. Social authentication may not work.")
    social_urlpatterns = [] # Provide an empty list to prevent further errors


urlpatterns = [
    path("admin/", admin.site.urls),
    # API base path
    path("api/v1/", include([
        path("", include("store.api_urls")),
        path("payments/", include("payment.api_urls")),

        # dj-rest-auth core URLs (login, logout, user details, password reset/change)
        path("auth/", include("dj_rest_auth.urls")),

        # dj-rest-auth registration URLs (email/password registration)
        path("auth/registration/", include("dj_rest_auth.registration.urls")),

        # --- CRUCIAL FIX FOR GOOGLE AUTHENTICATION ---
        # Include the explicitly imported social_urlpatterns under the registration path.
        # This will make endpoints like /api/v1/auth/registration/google/ available.
        path("auth/registration/", include(social_urlpatterns)), # <--- This is the key change

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

