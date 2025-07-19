# users/serializers.py
from dj_rest_auth.registration.serializers import SocialLoginSerializer
from rest_framework import serializers
from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.providers.google.provider import GoogleProvider

# Assuming you have a CustomRegisterSerializer defined elsewhere in this file
# If not, you might need to import or define it.
# Example placeholder:
# from dj_rest_auth.registration.serializers import RegisterSerializer as DefaultRegisterSerializer
# class CustomRegisterSerializer(DefaultRegisterSerializer):
#     # Add your custom fields or overrides here
#     pass

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

# You might need to adjust your REST_AUTH settings in base.py to use this custom serializer
# REST_AUTH = {
#     ...
#     "SOCIAL_ACCOUNT_ADAPTER": "users.serializers.CustomGoogleSocialLoginSerializer", # Not exactly, but for context
#     "SOCIAL_LOGIN_SERIALIZER": "users.serializers.CustomGoogleSocialLoginSerializer",
# }
# However, dj_rest_auth typically uses SocialLoginSerializer directly.
# We'll override it by making sure this serializer is picked up.
# This might require a custom SocialLoginView if dj_rest_auth doesn't allow direct serializer override for social.

# For dj_rest_auth to use a custom SocialLoginSerializer, you typically set it in REST_AUTH:
# REST_AUTH = {
#     ...
#     "SOCIAL_LOGIN_SERIALIZER": "users.serializers.CustomGoogleSocialLoginSerializer",
# }
# Let's add this to your settings.base.py.


