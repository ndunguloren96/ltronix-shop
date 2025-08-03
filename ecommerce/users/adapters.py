# users/adapters.py
import logging

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

class CustomAccountAdapter(DefaultAccountAdapter):
    def clean_username(self):
        # Prevent allauth from trying to create a username
        return None

    def clean_email(self, email):
        # Allow email to be optional if phone number is provided
        if not email and 'phone_number' in self.request.data:
            return None
        return super().clean_email(email)

    def populate_username(self, request, user):
        # Do not populate username from email
        pass

    def is_open_for_signup(self, request):
        # Allow signup if either email or phone number is provided
        if 'email' in request.data or 'phone_number' in request.data:
            return True
        return super().is_open_for_signup(request)

    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        user.first_name = request.data.get('first_name', '')
        user.last_name = request.data.get('last_name', '')
        user.phone_number = request.data.get('phone_number', '')
        if commit:
            user.save()
        return user

class DebugSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_app(self, request, provider, client_id=None):
        """
        Overrides the default get_app to add detailed debugging and resolve the MultipleObjectsReturned issue.
        """
        logger.info(f"[ADAPTER] get_app called for provider: {provider}, client_id: {client_id}")

        try:
            # Start with a base queryset for the provider on the current site
            apps = SocialApp.objects.on_site(request).filter(provider=provider)
            logger.info(f"[ADAPTER] Found {apps.count()} app(s) for provider '{provider}' on the current site.")

            if client_id:
                apps = apps.filter(client_id=client_id)
                logger.info(f"[ADAPTER] Filtered to {apps.count()} app(s) with client_id '{client_id}'.")

            if apps.count() == 0:
                logger.error(f"[ADAPTER] SocialApp.DoesNotExist for provider '{provider}' and client_id '{client_id}'. Please check your Django admin.")
                raise SocialApp.DoesNotExist # Or ObjectDoesNotExist for clarity with allauth

            if apps.count() > 1:
                # If multiple apps are found even after site and provider filtering,
                # it's still an issue that needs to be addressed in the admin.
                # But for the purpose of getting one, we can return the first,
                # or raise the error more definitively from here.
                # Given allauth expects unique, raising here is better than silently picking one.
                logger.error(f"[ADAPTER] SocialApp.MultipleObjectsReturned for provider '{provider}' and client_id '{client_id}'. Found {apps.count()} apps. There should be only one SocialApp for this provider on this site.")
                raise MultipleObjectsReturned # Explicitly raise here if you find multiple
            
            # If exactly one app is found after filtering, return it.
            if apps.count() == 1:
                logger.info(f"[ADAPTER] Successfully retrieved single app for provider '{provider}'.")
                return apps.first() # Return the single app found by your query

            # Fallback to super() if for some reason the above logic doesn't return,
            # though ideally the above covers all expected scenarios (0, 1, >1).
            # This line might not be strictly necessary with the above, but kept for safety.
            return super().get_app(request, provider, client_id=client_id)

        except ObjectDoesNotExist as e: # Catch ObjectDoesNotExist from your raise or super()
            logger.error(f"[ADAPTER] Final catch: SocialApp.DoesNotExist for provider '{provider}'. Ensure a SocialApp is configured in the Django admin.")
            raise e
        except MultipleObjectsReturned as e: # Catch MultipleObjectsReturned from your raise or super()
            logger.error(f"[ADAPTER] Final catch: SocialApp.MultipleObjectsReturned for provider '{provider}'. Please remove duplicate SocialApp entries in the Django admin.")
            raise e
        except Exception as e:
            logger.error(f"[ADAPTER] An unexpected error occurred in get_app: {e}", exc_info=True)
            raise e

    def sociallogin(self, request, sociallogin):
        logger.info(f"[ADAPTER] sociallogin called for user: {sociallogin.user.email}")
        logger.info(f"[ADAPTER] SocialLogin instance: {sociallogin}")
        if sociallogin.token:
            logger.info(f"[ADAPTER] SocialToken exists: {sociallogin.token}")
            logger.info(f"[ADAPTER] SocialToken.token: {sociallogin.token.token}")
            logger.info(f"[ADAPTER] SocialToken.token_secret: {sociallogin.token.token_secret}")
            logger.info(f"[ADAPTER] SocialToken.expires_at: {sociallogin.token.expires_at}")
        else:
            logger.warning("[ADAPTER] SocialToken is None or empty.")
        return super().sociallogin(request, sociallogin)
