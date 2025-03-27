from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import register, profile, profile_update  # Ensure profile_update is imported

urlpatterns = [
    path(
        "login/",
        auth_views.LoginView.as_view(template_name="registration/login.html"),
        name="login",
    ),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path(
        "password_reset/",
        auth_views.PasswordResetView.as_view(template_name="core/password_reset.html"),
        name="password_reset",
    ),
    path("profile/", profile, name="profile"),
    path("register/", register, name="register"),  # Ensure this path exists
    path("profile/update/", profile_update, name="profile_update"),  # Ensure this path exists
]
