# ecommerce/users/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from allauth.account.views import confirm_email as allauth_confirm_email
from django.urls import reverse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .serializers import CustomRegisterSerializer

class CustomRegisterView(generics.CreateAPIView):
    """
    Custom API view for user registration.
    This view uses CustomRegisterSerializer and directly integrates with django-allauth's
    user creation and email verification flow, bypassing dj-rest-auth's default
    registration view to avoid 'username' field conflicts.
    """
    serializer_class = CustomRegisterSerializer
    permission_classes = () # Allow any user to register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        # You might want to return a more specific message for email verification
        return Response(
            {"detail": "Registration successful. Please check your email for verification."},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer):
        # The serializer's save method handles user creation and allauth integration
        return serializer.save(self.request)

# You might want a custom view for email confirmation if you're not using dj-rest-auth's default
# For now, we'll assume allauth handles the confirmation URL directly or via a simple redirect.
# If you need a DRF endpoint to confirm email, you'd build it here.
# Example:
# @method_decorator(csrf_exempt, name='dispatch') # Only if you need to disable CSRF for this specific view (not recommended for production)
# class CustomConfirmEmailView(APIView):
#     permission_classes = ()
#
#     def get(self, request, key, *args, **kwargs):
#         try:
#             email_confirmation = EmailConfirmationHMAC.from_key(key)
#             email_confirmation.confirm(request)
#             return Response({"detail": "Email confirmed successfully."}, status=status.HTTP_200_OK)
#         except EmailConfirmationHMAC.DoesNotExist:
#             return Response({"detail": "Invalid or expired confirmation link."}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

