from django.urls import path, include

# Define the v1 API routes
urlpatterns = [
    # dj-rest-auth URLs for authentication
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')), # For signup
    # Add social login URLs here when ready, e.g.,
    # path('auth/social/', include('allauth.socialaccount.urls')),
]