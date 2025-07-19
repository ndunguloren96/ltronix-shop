# users/serializers.py
from dj_rest_auth.registration.serializers import SocialLoginSerializer
from rest_framework import serializers
from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.providers.google.provider import GoogleProvider
from django.contrib.auth import get_user_model

User = get_user_model()

# Assuming you have a CustomRegisterSerializer defined elsewhere in this file
# If not, you might need to import or define it.
# Example placeholder:
# from dj_rest_auth.registration.serializers import RegisterSerializer as DefaultRegisterSerializer
# class CustomRegisterSerializer(DefaultRegisterSerializer):
#     # Add your custom fields or overrides here
#     pass

# FIX: Define UserDetailsSerializer as expected by dj-rest-auth
class UserDetailsSerializer(serializers.ModelSerializer):
    """
    Serializer for the custom User model details.
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
        read_only_fields = ('email',) # Email should generally not be changeable via this endpoint

class CustomGoogleSocialLoginSerializer(SocialLoginSerializer):
    """
    A custom serializer for Google social login to add debug prints.
    """
    access_token = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(required=False, allow_blank=True) # NextAuth sends code, then exchanges for access_token

    def validate(self, attrs):
        # DEBUG: Print the raw attributes received by the serializer
        print(f"DEBUG: CustomGoogleSocialLoginSerializer - Raw attrs: {attrs}")

        # Get the access token. NextAuth usually sends access_token directly.
        # If it sends 'code', dj-rest-auth/allauth will handle the exchange.
        access_token = attrs.get('access_token')
        code = attrs.get('code')

        if not access_token and not code:
            raise serializers.ValidationError("Either 'access_token' or 'code' is required.")

        # This is where allauth tries to get the provider app
        adapter = get_adapter()
        provider = GoogleProvider.id # Explicitly use GoogleProvider ID

        # DEBUG: Print the provider and client_id that get_app will use
        # The client_id is usually derived internally by allauth from the provider app settings
        # This part is tricky to get directly from attrs, as it's an internal lookup.
        # We'll rely on the MultipleObjectsReturned traceback for client_id issues.
        print(f"DEBUG: CustomGoogleSocialLoginSerializer - Provider ID being used: {provider}")

        # Call the original validate method
        return super().validate(attrs)


