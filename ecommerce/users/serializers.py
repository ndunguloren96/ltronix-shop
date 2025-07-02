# ecommerce/users/serializers.py
from allauth.account.adapter import get_adapter  # Import allauth adapter
from allauth.account.utils import setup_user_email  # For allauth email setup
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model # Import get_user_model for EmailChangeSerializer

from .models import User, UserProfile # Assuming UserProfile is also in .models

# Get the custom User model
User = get_user_model()


# Your existing UserDetailsSerializer
class UserDetailsSerializer(serializers.ModelSerializer):
    middle_name = serializers.CharField(source='profile.middle_name', required=False, allow_blank=True) # Corrected truncation

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
        )
        read_only_fields = ("email", "date_joined", "is_staff", "is_active")

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        middle_name = profile_data.get('middle_name')

        # Update User fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number) # Corrected truncation
        instance.gender = validated_data.get('gender', instance.gender)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth) # Corrected truncation
        instance.save()
        # Update or create UserProfile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        profile.middle_name = middle_name if middle_name is not None else profile.middle_name # Corrected truncation
        profile.save()

        return instance


# Custom Register Serializer for email-only registration
class CustomRegisterSerializer(
    serializers.Serializer
):  # *** IMPORTANT: No longer inherits from DefaultRegisterSerializer ***
    email = serializers.EmailField(required=True, allow_blank=False, max_length=254) # Corrected truncation
    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150) # Corrected truncation
    middle_name = serializers.CharField(required=False, allow_blank=True, max_length=150) # Corrected truncation
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150) # Corrected truncation
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=20) # Corrected truncation
    gender = serializers.CharField(required=False, allow_blank=True, max_length=1)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

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
            "middle_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
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
            phone_number=self.validated_data.get("phone_number"),
            gender=self.validated_data.get("gender"),
            date_of_birth=self.validated_data.get("date_of_birth"),
        )

        # Create UserProfile for middle_name
        UserProfile.objects.create(
            user=user,
            middle_name=self.validated_data.get("middle_name", "")
        )

        # Setup user email (allauth's way of managing verified emails)
        setup_user_email(request, user, [])

        # Create customer profile linked to the new user
        from store.models import \
            Customer  # Import here to avoid circular dependency

        Customer.objects.get_or_create(user=user)

        return user


# NEWLY ADDED: EmailChangeSerializer
class EmailChangeSerializer(serializers.Serializer):
    new_email = serializers.EmailField(required=True, max_length=254)
    current_password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    def validate_new_email(self, value):
        # Ensure the new email is not already in use by another user
        request_user_id = None
        if self.context and 'request' in self.context and hasattr(self.context['request'], 'user'):
            request_user_id = self.context['request'].user.id

        if User.objects.filter(email=value).exclude(id=request_user_id).exists():
            raise serializers.ValidationError("This email is already in use by another account.")
        return value

    def validate(self, data):
        # Validate the current password against the requesting user's password
        user = None
        if self.context and 'request' in self.context and hasattr(self.context['request'], 'user'):
            user = self.context['request'].user

        if not user or not user.check_password(data['current_password']):
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
