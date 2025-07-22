# ecommerce/users/serializers.py

from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import User, UserProfile

# Get the custom User model
User = get_user_model()


# Your existing UserDetailsSerializer
# This serializer describes the User and UserProfile models.
# It is important to keep this as the foundational representation of a user,
# even if public APIs for updating it are removed. It is likely used by the
# Django Admin browsable API, and forms the basis for future tiers.
class UserDetailsSerializer(serializers.ModelSerializer):
    middle_name = serializers.CharField(source='profile.middle_name', required=False, allow_blank=True)

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
        read_only_fields = ("id", "email", "date_joined", "is_staff", "is_active")

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
        # Update or create UserProfile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        profile.middle_name = middle_name if middle_name is not None else profile.middle_name
        profile.save()

        return instance
