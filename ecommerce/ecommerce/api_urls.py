# ecommerce/ecommerce/api_urls.py
from django.urls import path, include

urlpatterns = [
    # dj‑rest‑auth: login, logout, password, etc.
    path('', include('dj_rest_auth.urls')),

    # Registration
    path('registration/', 
         # This will be a 405 if you forgot to remove TOKEN_MODEL=None above
         include('dj_rest_auth.registration.urls')
    ),

    # Social‑token conversion (drf-social-oauth2)
    path('', include('drf_social_oauth2.urls', namespace='drf_social_oauth2')),
]
