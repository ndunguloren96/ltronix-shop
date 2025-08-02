# users/adapters.py
import logging

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist # Import ObjectDoesNotExist

logger = logging.getLogger(__name__)


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
