# ecommerce/users/serializers.py
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from allauth.account.utils import setup_user_email

from .models import User, UserProfile
from sellers.models import Seller

User = get_user_model()


class CustomLoginSerializer(serializers.Serializer):
    """Serializer for custom user login."""
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        """Validates the serializer data."""
        email = attrs.get('email')
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')

        user = None

        if not email and not phone_number:
            raise serializers.ValidationError({'non_field_errors': [_('Either email or phone number must be provided.')]})

        if email and phone_number:
            raise serializers.ValidationError({'non_field_errors': [_('Please provide either an email or a phone number, not both.')]})

        if email and '@' not in email:
            raise serializers.ValidationError({'email': [_('Enter a valid email address.')]})

        if phone_number and '@' in phone_number:
            raise serializers.ValidationError({'phone_number': [_('This does not look like a valid phone number.')]})

        if phone_number and not phone_number.isdigit():
            raise serializers.ValidationError({'phone_number': [_('Enter a valid phone number.')]})

        if email:
            # Authenticate using email
            user = authenticate(request=self.context.get('request'), email=email, password=password)
        elif phone_number:
            # Find user by phone number, then authenticate using their email
            try:
                user_obj = User.objects.get(phone_number=phone_number)
                user = authenticate(request=self.context.get('request'), email=user_obj.email, password=password)
            except User.DoesNotExist:
                pass  # User with this phone number does not exist

        if not user:
            msg = _('Unable to log in with provided credentials.')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class CustomRegisterSerializer(serializers.ModelSerializer):
    """Serializer for custom user registration."""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'phone_number', 'password')

    def validate(self, data):
        """Validates the serializer data."""
        email = data.get('email')
        phone_number = data.get('phone_number')

        if not email and not phone_number:
            raise serializers.ValidationError(_("Either email or phone number must be provided."))

        if email and phone_number:
            raise serializers.ValidationError(_("Please provide either an email or a phone number for registration, not both."))

        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError(_("A user with that email already exists."))

        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError(_("A user with that phone number already exists."))

        return data

    def create(self, validated_data):
        """Creates a new user."""
        phone_number = validated_data.get('phone_number')
        email = validated_data.get('email')

        if not email and not phone_number:
            raise serializers.ValidationError(_("Either email or phone number must be provided."))

        # Ensure that if a user signs up with a phone number, the email field is set to None
        if phone_number and not email:
            validated_data['email'] = None

        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


class UserDetailsSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    middle_name = serializers.CharField(source='profile.middle_name', required=False, allow_blank=True)
    is_seller = serializers.SerializerMethodField()
    seller_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
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
        """Updates the user and their profile."""
        profile_data = validated_data.pop('profile', {})
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.save()

        profile, created = UserProfile.objects.get_or_create(user=instance)
        if 'middle_name' in profile_data:
            profile.middle_name = profile_data['middle_name']
            profile.save()
        
        return instance

    def get_is_seller(self, obj):
        """Checks if the user is a seller."""
        return hasattr(obj, 'seller_profile') and obj.seller_profile.is_active

    def get_seller_profile(self, obj):
        """Returns the seller profile of the user."""
        from sellers.serializers import SellerSerializer
        try:
            seller_instance = obj.seller_profile
            if seller_instance:
                return SellerSerializer(seller_instance).data
            return None
        except Seller.DoesNotExist:
            return None


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password1 = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, data):
        """Validates the serializer data."""
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "New passwords must match."})
        return data


class EmailChangeSerializer(serializers.Serializer):
    """Serializer for email change."""
    current_password = serializers.CharField(required=True)
    new_email = serializers.EmailField(required=True)

    def validate(self, data):
        """Validates the serializer data."""
        request = self.context.get('request')
        user = request.user if request else None

        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({"current_password": "Wrong password."})
            
        if user and user.email == data['new_email']:
            raise serializers.ValidationError({"new_email": "The new email cannot be the same as the current email."})

        return data

    def save(self, request):
        """Saves the new email."""
        user = request.user
        new_email = self.validated_data['new_email']

        with transaction.atomic():
            user.email = new_email
            user.save()
            setup_user_email(request, user, [])

        return user