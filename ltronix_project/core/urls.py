from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import register, profile, profile_update  # Ensure profile_update is imported

app_name = 'core' # Define the namespace

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('home/', views.home, name='home'),
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
