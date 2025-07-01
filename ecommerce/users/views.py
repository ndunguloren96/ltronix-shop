# ecommerce/users/views.py

from rest_framework import generics, status
from rest_framework.response import Response

# Make sure to import your custom serializer
from .serializers import (  # Ensure UserDetailsSerializer is imported if used elsewhere
    CustomRegisterSerializer, UserDetailsSerializer)

# We no longer need allauth_confirm_email or Django redirect/CSRF decorators here
# as the email confirmation is managed by allauth's internal flow or a separate DRF endpoint if you create one.



class CustomRegisterView(generics.CreateAPIView):
    """
    Custom API view for user registration.
    This view uses CustomRegisterSerializer and directly integrates with django-allauth's
    user creation and email verification flow, bypassing dj-rest-auth's default
    registration view to avoid 'username' field conflicts.
    """

    serializer_class = CustomRegisterSerializer
    permission_classes = ()  # Allow any user to register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # The serializer's save method now handles user creation and allauth integration
        user = serializer.save(self.request)

        headers = self.get_success_headers(serializer.data)

        # Return a clear success message. Allauth handles email verification in the background.
        return Response(
            {
                "detail": "Registration successful. Please check your email for verification if email verification is enabled.",
                "user_id": user.id,
                "email": user.email,
            },  # Provide some user info for the frontend
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    # The perform_create method is effectively replaced by serializer.save(self.request)
    # in the create method, so you can remove it or keep it simple if other logic needs it.
    # For now, it's integrated directly into `create`.
