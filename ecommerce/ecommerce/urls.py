# ecommerce/ecommerce/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

# Import the specific callback function from payment.views
from payment.views import mpesa_stk_push_callback

# Import your custom views from the users app
# from users.views import ( # Commented out as CustomRegisterView might be handled via settings
#     CustomRegisterView,
#     EmailChangeView,
#     AccountDeleteView,
# )
from users.views import EmailChangeView, AccountDeleteView # Keep these if you use them

from dj_rest_auth.views import PasswordChangeView # Keep for password change view

# Import Spectacular views directly
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


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
        # This line explicitly includes dj_rest_auth's social authentication URLs
        # under the "registration" path, which the frontend's NextAuth.js expects
        # for POSTing the Google access token to Django.
        # This will make the /api/v1/auth/registration/google/ endpoint available.
        path("auth/registration/", include("dj_rest_auth.social.urls")), # <--- This is the key addition

        # AllAuth URLs (still needed for the initial OAuth flow and redirect from Google)
        # This is where Google redirects the user after authentication, before NextAuth.js
        # sends the access_token to your dj-rest-auth backend.
        path("accounts/", include("allauth.urls")),

        # Custom user-related views (ensure these imports match if CustomRegisterView is moved/removed)
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
