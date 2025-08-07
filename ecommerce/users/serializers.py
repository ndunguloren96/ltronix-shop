# ecommerce/users/serializers.py
from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer
from django.utils.translation import gettext_lazy as _

from .models import User, UserProfile
from sellers.models import Seller

User = get_user_model()


class CustomLoginSerializer(LoginSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get('email')
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')

        user = None

        if not email and not phone_number:
            raise serializers.ValidationError('Either email or phone number must be provided.')

        if email and phone_number:
            raise serializers.ValidationError('Please provide either an email or a phone number, not both.')

        if email:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
        elif phone_number:
            try:
                user_obj = User.objects.get(phone_number=phone_number)
                user = authenticate(request=self.context.get('request'), email=user_obj.email, password=password)
            except User.DoesNotExist:
                pass

        if not user:
            msg = _('Unable to log in with provided credentials.')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class UserDetailsSerializer(serializers.ModelSerializer):
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
        return hasattr(obj, 'seller_profile') and obj.seller_profile.is_active

    def get_seller_profile(self, obj):
        from sellers.serializers import SellerSerializer
        try:
            seller_instance = obj.seller_profile
            if seller_instance:
                return SellerSerializer(seller_instance).data
            return None
        except Seller.DoesNotExist:
            return None


class CustomRegisterSerializer(RegisterSerializer):
    phone_number = serializers.CharField(required=False, max_length=20, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('email') and not data.get('phone_number'):
            raise serializers.ValidationError("Either email or phone number must be provided.")
        
        if data.get('email') and data.get('phone_number'):
            raise serializers.ValidationError("Please provide either an email or a phone number for registration, not both.")

        if data.get('email') and User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        
        if data.get('phone_number') and User.objects.filter(phone_number=data['phone_number']).exists():
            raise serializers.ValidationError("A user with that phone number already exists.")

        return data

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.phone_number = self.validated_data.get('phone_number', '')
        user.email = self.validated_data.get('email', '')
        user.save()
        UserProfile.objects.get_or_create(user=user)
        return user


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password1 = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "New passwords must match."})
        return data


class EmailChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_email = serializers.EmailField(required=True)

    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request else None

        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({"current_password": "Wrong password."})
            
        if user and user.email == data['new_email']:
            raise serializers.ValidationError({"new_email": "The new email cannot be the same as the current email."})

        return data

    def save(self, request):
        user = request.user
        new_email = self.validated_data['new_email']

        with transaction.atomic():
            user.email = new_email
            user.save()
            setup_user_email(request, user, [])

        return user
