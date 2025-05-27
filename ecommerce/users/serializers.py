# ecommerce/users/serializers.py
from rest_framework import serializers
from allauth.account import app_settings as allauth_settings
from allauth.account.utils import setup_user_email
from django.contrib.auth import get_user_model
from django.db import transaction

# Get the custom User model
User = get_user_model()

class CustomRegisterSerializer(serializers.Serializer):
    """
    A custom serializer for user registration.
    This serializer is designed to work with email-only authentication
    and does not inherit from dj_rest_auth's RegisterSerializer to avoid
    'username' field conflicts.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    # Add any other fields your custom User model might have for registration
    # For example:
    # first_name = serializers.CharField(max_length=30, required=False, allow_blank=True)
    # last_name = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate(self, data):
        # Validate that passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        # Validate that email is unique
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})

        return data

    @transaction.atomic
    def save(self, request):
        """
        Creates and saves a new user instance using allauth's adapter.
        """
        adapter = allauth_settings.ADAPTER
        user = User(email=self.validated_data['email'])
        user.set_password(self.validated_data['password'])

        # If you added custom fields, save them here:
        # user.first_name = self.validated_data.get('first_name', '')
        # user.last_name = self.validated_data.get('last_name', '')

        # Use allauth's adapter to save the user, which handles activation, etc.
        adapter.save_user(request, user, form=self)

        # Set up user email for allauth's email verification flow
        setup_user_email(request, user, []) # The second argument is for verified_emails, typically empty for new users

        return user

# --- Djoser-specific serializers (still commented out) ---
# As discussed, Djoser is not part of the current Milestone 4, Part 1 scope.
# If you need Djoser functionality elsewhere, we'll need to re-evaluate.
# from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
# from djoser.serializers import UserSerializer as DjoserUserSerializer

# class UserCreateSerializer(DjoserUserCreateSerializer):
#     class Meta(DjoserUserCreateSerializer.Meta):
#         model = User
#         fields = ('id', 'email', 'password')

# class UserSerializer(DjoserUserSerializer):
#     class Meta(DjoserUserSerializer.Meta):
#         model = User
#         fields = ('id', 'email')
#         read_only_fields = ('email',)
