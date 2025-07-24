# users/adapters.py
import logging

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp

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
                raise SocialApp.DoesNotExist

            if apps.count() > 1:
                logger.error(f"[ADAPTER] SocialApp.MultipleObjectsReturned for provider '{provider}'. There should be only one SocialApp for this provider on this site.")
                # Instead of raising, we could try to return the first one, but it's better to enforce a clean setup.
                # For now, we'll log the error and let the original logic handle it, which might raise the exception.
                pass

            # Let the original logic (or a more specific query) try to resolve it.
            # This will raise the appropriate exception if there's still an issue.
            return super().get_app(request, provider, client_id=client_id)

        except SocialApp.DoesNotExist as e:
            logger.error(f"[ADAPTER] Final catch: SocialApp.DoesNotExist for provider '{provider}'. Ensure a SocialApp is configured in the Django admin.")
            raise e
        except SocialApp.MultipleObjectsReturned as e:
            logger.error(f"[ADAPTER] Final catch: SocialApp.MultipleObjectsReturned for provider '{provider}'. Please remove duplicate SocialApp entries in the Django admin.")
            raise e
        except Exception as e:
            logger.error(f"[ADAPTER] An unexpected error occurred in get_app: {e}", exc_info=True)
            raise e

