# ecommerce/users/serializers.py
from allauth.account.adapter import get_adapter # Import allauth adapter
from allauth.account.utils import setup_user_email # For allauth email setup
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model # Import get_user_model for EmailChangeSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer # Import RegisterSerializer

from .models import User, UserProfile # Assuming UserProfile is also in .models

# Import the Seller model for type hinting and logic
from sellers.models import Seller

# Get the custom User model
User = get_user_model()


# Your existing UserDetailsSerializer
class UserDetailsSerializer(serializers.ModelSerializer):
    middle_name = serializers.CharField(source='profile.middle_name', required=False, allow_blank=True)
    is_seller = serializers.SerializerMethodField()
    
    # Use a SerializerMethodField to get the seller profile to avoid a circular import.
    # The actual serialization will happen in the get_seller_profile method.
    seller_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", # Ensure 'id' is included for NextAuth.js
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "is_staff",
            "is_active",
            "date_joined",
            "is_seller",
            "seller_profile",
        )
        read_only_fields = ("id", "email", "date_joined", "is_staff", "is_active", "is_seller", "seller_profile")

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update User fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.save()

        # Update UserProfile fields (e.g., middle_name)
        profile, created = UserProfile.objects.get_or_create(user=instance)
        if 'middle_name' in profile_data:
            profile.middle_name = profile_data['middle_name']
            profile.save()
        
        return instance

    def get_is_seller(self, obj):
        """
        Determines if the user has an associated seller profile.
        """
        return hasattr(obj, 'seller_profile') and obj.seller_profile.is_active

    def get_seller_profile(self, obj):
        """
        Custom method to serialize the seller profile, if it exists.
        This import is done inside the method to avoid a top-level circular import.
        """
        from sellers.serializers import SellerSerializer
        try:
            seller_instance = obj.seller_profile
            # Check if seller_instance is not None before serializing
            if seller_instance:
                return SellerSerializer(seller_instance).data
            return None
        except Seller.DoesNotExist:
            return None


# A CustomRegisterSerializer for a minimal, email-based signup.
# We override the RegisterSerializer to handle the 'username' field correctly.
class CustomRegisterSerializer(RegisterSerializer):
    first_name = serializers.CharField(required=False, max_length=150)
    last_name = serializers.CharField(required=False, max_length=150)
    phone_number = serializers.CharField(required=False, max_length=20, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, data):
        # Ensure either email or phone_number is provided
        if not data.get('email') and not data.get('phone_number'):
            raise serializers.ValidationError("Either email or phone number must be provided.")
        
        # If email is provided, ensure it's unique
        if data.get('email') and User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        
        # If phone_number is provided, ensure it's unique
        if data.get('phone_number') and User.objects.filter(phone_number=data['phone_number']).exists():
            raise serializers.ValidationError("A user with that phone number already exists.")

        # Remove password2 as it's no longer needed
        if 'password2' in data:
            del data['password2']

        return data

    @transaction.atomic
    def save(self, request):
        adapter = get_adapter()
        user = adapter.save_user(
            request,
            None, # form is not used here, as we are passing data directly
            commit=False
        )
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.phone_number = self.validated_data.get('phone_number', '')
        user.email = self.validated_data.get('email', '') # Set email if provided

        # Set password using the validated password from the parent serializer
        user.set_password(self.validated_data['password'])
        user.save()

        # Create an empty UserProfile for the new user
        UserProfile.objects.get_or_create(user=user)

        setup_user_email(request, user, [])
        return user



# Your existing PasswordChangeSerializer remains unchanged.
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password1 = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "New passwords must match."})
        return data

# Your existing EmailChangeSerializer
class EmailChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_email = serializers.EmailField(required=True)

    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request else None

        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({"current_password": "Wrong password."})
            
        # Ensure the new email is different from the current email
        if user and user.email == data['new_email']:
            raise serializers.ValidationError({"new_email": "The new email cannot be the same as the current email."})

        return data

    def save(self, request):
        user = request.user
        new_email = self.validated_data['new_email']

        with transaction.atomic():
            # Update the user's email
            user.email = new_email
            user.save()

            setup_user_email(request, user, [])

        return user
