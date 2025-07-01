# ecommerce/users/serializers.py
from allauth.account.adapter import get_adapter  # Import allauth adapter
from allauth.account.utils import setup_user_email  # For allauth email setup
from django.db import transaction
from rest_framework import serializers

from .models import User


# Your existing UserDetailsSerializer
class UserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("email", "date_joined", "is_staff", "is_active")


# Custom Register Serializer for email-only registration
class CustomRegisterSerializer(
    serializers.Serializer
):  # *** IMPORTANT: No longer inherits from DefaultRegisterSerializer ***
    email = serializers.EmailField(required=True, allow_blank=False, max_length=255)
    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    # AllAuth requires password confirmation during registration
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        help_text="Required field.",
    )

    class Meta:
        fields = (
            "email",
            "password",
            "password_confirm",  # Include for validation
            "first_name",
            "last_name",
        )
        extra_kwargs = {
            "password": {"write_only": True},
            "password_confirm": {"write_only": True},
        }

    def validate_email(self, email):
        email = get_adapter().clean_email(email)
        return email

    def validate_password_confirm(self, value):
        password = self.initial_data.get("password")
        if password and value != password:
            raise serializers.ValidationError("Passwords do not match.")
        return value

    @transaction.atomic
    def save(self, request):
        adapter = get_adapter()
        # Create user directly
        user = User.objects.create_user(
            email=self.validated_data["email"],
            password=self.validated_data["password"],
            first_name=self.validated_data.get("first_name", ""),
            last_name=self.validated_data.get("last_name", ""),
        )

        # Setup user email (allauth's way of managing verified emails)
        setup_user_email(request, user, [])

        # Create customer profile linked to the new user
        from store.models import \
            Customer  # Import here to avoid circular dependency

        Customer.objects.get_or_create(user=user)

        return user
