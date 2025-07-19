# ecommerce/users/views.py

from rest_framework import generics, status, permissions
from rest_framework.response import Response

# No public views needed for Starter Launch.
# All views here (PasswordChangeView, EmailChangeView, AccountDeleteView, CustomRegisterView)
# are for public API authentication which is being removed.
# The User model and its management via Django Admin remain.

# Keep these imports if they are truly used by other views or logic not yet removed.
# For now, since all listed views are being removed, these imports become redundant here.
# from dj_rest_auth.serializers import PasswordChangeSerializer
# from .serializers import EmailChangeSerializer, CustomRegisterSerializer
# from dj_rest_auth.registration.views import RegisterView
