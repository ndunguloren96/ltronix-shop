# ecommerce/users/serializers.py
from allauth.account.adapter import get_adapter # Import allauth adapter
from allauth.account.utils import setup_user_email # For allauth email setup
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model # Import get_user_model for EmailChangeSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer # Import RegisterSerializer

from .models import User, UserProfile # Assuming UserProfile is also in .models
from sellers.models import Seller # Import the Seller model
from sellers.serializers import SellerSerializer # Import the new SellerSerializer

# Get the custom User model
User = get_user_model()


# Your existing UserDetailsSerializer
class UserDetailsSerializer(serializers.ModelSerializer):
    middle_name = serializers.CharField(source='profile.middle_name', required=False, allow_blank=True)
    is_seller = serializers.SerializerMethodField()
    seller_profile = SellerSerializer(source='seller_profile', read_only=True) # Nested serializer for seller details

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
            "is_seller",       # Add this field
            "seller_profile",  # Add this field
        )
        read_only_fields = ("id", "email", "date_joined", "is_staff", "is_active", "is_seller", "seller_profile") # 'id' should be read-only

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        middle_name = profile_data.get('middle_name')

        # Update User fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.save()

        # Update UserProfile fields (e.g., middle_name)
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            if middle_name is not None:
                profile.middle_name = middle_name
                profile.save()
        
        return instance

    def get_is_seller(self, obj):
        """
        Determines if the user has an associated seller profile.
        """
        return hasattr(obj, 'seller_profile') and obj.seller_profile.is_active


# NEWLY ADDED: CustomRegisterSerializer
class CustomRegisterSerializer(RegisterSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    gender = serializers.CharField(required=False, allow_blank=True, max_length=10)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        data['phone_number'] = self.validated_data.get('phone_number', '')
        data['gender'] = self.validated_data.get('gender', '')
        data['date_of_birth'] = self.validated_data.get('date_of_birth', None)
        return data

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get('first_name')
        user.last_name = self.cleaned_data.get('last_name')
        user.phone_number = self.cleaned_data.get('phone_number')
        user.gender = self.cleaned_data.get('gender')
        user.date_of_birth = self.cleaned_data.get('date_of_birth')
        user.save()

        # Create or update UserProfile with middle_name if needed
        middle_name = self.validated_data.get('middle_name') # Assuming middle_name might be passed
        if middle_name:
            UserProfile.objects.update_or_create(user=user, defaults={'middle_name': middle_name})
        elif not hasattr(user, 'profile'): # Create profile if it doesn't exist and middle_name isn't provided
            UserProfile.objects.create(user=user)

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

            # If you are using allauth, you might want to manage email addresses via allauth's EmailAddress model.
            # This ensures proper verification flows if you have them configured.
            # You might want to invalidate old EmailAddress objects or mark them as not primary/verified.
            # For simplicity, if allauth handles primary emails, you might do something like:
            # from allauth.account.models import EmailAddress
            # EmailAddress.objects.filter(user=user, primary=True).update(primary=False, verified=False)
            # EmailAddress.objects.create(user=user, email=new_email, primary=True, verified=False)
            # Or use allauth's setup_user_email which handles primary email changes (it usually creates a new one and handles the old)
            setup_user_email(request, user, [])

        return user
