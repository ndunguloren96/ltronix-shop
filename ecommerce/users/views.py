# ecommerce/users/views.py

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView # NEW IMPORT

# dj_rest_auth and allauth imports
from dj_rest_auth.views import LoginView as DjRestAuthLoginView, LogoutView, UserDetailsView, PasswordResetView, PasswordResetConfirmView
from dj_rest_auth.registration.views import VerifyEmailView, ResendEmailVerificationView, SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client

# Import Django's authentication functions
from django.contrib.auth import authenticate, get_user_model, login

# Import your custom serializers
from .serializers import EmailChangeSerializer, CustomRegisterSerializer, UserDetailsSerializer, UserDetailsSerializer # Ensure no duplicates

# Import the base RegisterView from dj-rest-auth
from dj_rest_auth.registration.views import RegisterView

# Get the custom User model
User = get_user_model()


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


# Custom registration view to use the CustomRegisterSerializer.
class CustomRegisterView(RegisterView):
    serializer_class = CustomRegisterSerializer


# Custom GoogleLogin view to integrate with dj-rest-auth's SocialLoginView
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.SOCIALACCOUNT_PROVIDERS['google']['AUTH_PARAMS']['redirect_uri']
    client_class = OAuth2Client


# NEWLY ADDED: A custom login view for NextAuth.js credentials provider
class NextAuthCredentialsLoginView(APIView):
    """
    This view is specifically designed to handle the credentials POST request
    from a NextAuth.js frontend. It authenticates the user and returns user
    details if successful.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate the user with Django's built-in function
        user = authenticate(request, email=email, password=password)

        if user is not None:
            # Login the user to create a session if needed (optional for stateless APIs)
            login(request, user)
            
            # Serialize the user data to return to the frontend
            serializer = UserDetailsSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

