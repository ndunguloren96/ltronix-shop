# ecommerce/users/views.py

from rest_framework import generics, status, permissions
from rest_framework.response import Response

# Import serializers from dj_rest_auth for standard operations
from dj_rest_auth.serializers import PasswordChangeSerializer

# Import your custom serializers
from .serializers import EmailChangeSerializer, CustomRegisterSerializer # Make sure to import CustomRegisterSerializer too

# Import the base RegisterView from dj-rest-auth
from dj_rest_auth.registration.views import RegisterView # <-- NEW IMPORTANT IMPORT

# allauth imports (if still needed for other logic, though not directly used in these views)
# from allauth.account.forms import ChangeEmailForm
# from allauth.account.adapter import get_adapter


class PasswordChangeView(generics.UpdateAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class EmailChangeView(generics.UpdateAPIView):
    serializer_class = EmailChangeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save(request=self.request)


class AccountDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailsSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


# NEWLY ADDED: CustomRegisterView
class CustomRegisterView(RegisterView):
    """
    Custom registration view to use the CustomRegisterSerializer.
    This overrides the default dj-rest-auth registration view.
    """
    serializer_class = CustomRegisterSerializer
    # You might want to add permission_classes here if not handled by dj-rest-auth defaults.
    # By default, registration views are usually open, but you can restrict if needed.
    # permission_classes = (permissions.AllowAny,)

