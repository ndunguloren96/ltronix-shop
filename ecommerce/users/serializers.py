# ecommerce/users/serializers.py

from rest_framework import serializers
from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from django.db import transaction
from .models import User
from dj_rest_auth.serializers import UserDetailsSerializer as DefaultUserDetailsSerializer

class CustomRegisterSerializer(serializers.Serializer):
    """
    Custom serializer for user registration.
    Overrides default RegisterSerializer fields to be email-only.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, data):
        # Password match
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Ensure email is unique via AllAuth
        adapter = get_adapter()
        adapter.validate_unique_email(data["email"])

        return data

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

    def save(self, request):
        """
        Handles integration with AllAuth for email setup.
        """
        user = self.create(self.validated_data)
        self.custom_signup(request, user)
        setup_user_email(request, user, [])
        return user

    def custom_signup(self, request, user):
        """
        Assign first_name and last_name in AllAuth signup flow.
        """
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save(update_fields=['first_name', 'last_name'])


class UserDetailsSerializer(DefaultUserDetailsSerializer):
    """
    Extends dj-rest-auth's UserDetailsSerializer to include name fields.
    """
    class Meta(DefaultUserDetailsSerializer.Meta):
        model = User
        fields = (
            'pk',
            'id',
            'email',
            'first_name',
            'last_name',
        )
        read_only_fields = ('email', 'pk', 'id', 'date_joined', 'is_staff', 'is_superuser')

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance.first_name = validated_data.get('first_name', instance.first_name)
            instance.last_name = validated_data.get('last_name', instance.last_name)
            instance.save()
            return instance
