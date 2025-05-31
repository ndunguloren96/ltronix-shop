# ecommerce/users/serializers.py

from rest_framework import serializers
# IMPORTANT: Import RegisterSerializer from allauth directly,
# as dj_rest_auth's one might cause issues with username field if not carefully handled.
from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from django.db import transaction
from .models import User # Import your custom User model
from allauth.account.forms import SignupForm # This form is often used by RegisterSerializer

from dj_rest_auth.serializers import UserDetailsSerializer as DefaultUserDetailsSerializer

# Custom Register Serializer
class CustomRegisterSerializer(serializers.Serializer): # Changed from RegisterSerializer to Serializer
    """
    Custom serializer for user registration.
    Overrides default RegisterSerializer fields to be email-only.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    # You might also want password2 for confirmation in the serializer
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, data):
        # Basic password matching validation
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if email is already registered using allauth's adapter
        # This prevents the allauth/django-rest-auth default RegisterSerializer
        # from trying to validate a username field.
        adapter = get_adapter()
        if adapter.username_field:
            # If adapter expects a username, but we are email-only, this should not happen
            pass # Or raise a configuration error if this path is unexpectedly hit
        
        # Validate email uniqueness via allauth adapter
        adapter.validate_unique_email(data["email"])

        return data

    def create(self, validated_data):
        # Create user without username
        user = User(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

    def save(self, request):
        # Allauth integration (copied from dj_rest_auth's RegisterSerializer logic)
        user = self.create(self.validated_data)
        self.custom_signup(request, user) # Call your custom_signup logic
        setup_user_email(request, user, []) # Ensure allauth email handling
        return user
    
    def custom_signup(self, request, user):
        """
        Called by allauth's signup process.
        Assigns first_name and last_name to the newly created user.
        """
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save(update_fields=['first_name', 'last_name'])

# Custom User Details Serializer (Keep as is, it's fine)
class UserDetailsSerializer(DefaultUserDetailsSerializer):
    """
    Custom serializer for viewing and updating user details.
    Extends dj_rest_auth's default UserDetailsSerializer to include
    first_name and last_name.
    """
    class Meta(DefaultUserDetailsSerializer.Meta):
        model = User # Use your custom User model
        fields = (
            'pk',
            'id', # Include 'id' for consistency if your frontend expects it
            'email',
            'first_name',
            'last_name',
            # Add any other fields you want to expose or allow updating
            # e.g., 'is_staff', 'date_joined' (read-only)
        )
        read_only_fields = ('email', 'pk', 'id', 'date_joined', 'is_staff', 'is_superuser') # Email is read-only if not allowing email change directly via this endpoint

    def update(self, instance, validated_data):
        """
        Custom update method to handle partial updates for user fields.
        """
        # It's good practice to wrap update operations in a transaction
        # to ensure data consistency.
        with transaction.atomic():
            instance.first_name = validated_data.get('first_name', instance.first_name)
            instance.last_name = validated_data.get('last_name', instance.last_name)
            # Add other fields you want to be updatable
            instance.save()
            return instance