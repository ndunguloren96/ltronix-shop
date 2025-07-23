# users/adapters.py
import logging

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp # Import SocialApp for direct query if needed

logger = logging.getLogger(__name__)


class DebugSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_app(self, request, provider, client_id=None):
        """
        Overrides the default get_app to add debugging.
        This method is called by allauth to retrieve the SocialApp instance.
        """
        print(f"DEBUG (Adapter): get_app called. Provider: {provider}, Client ID: {client_id}")
        logger.info(f"Searching for app: provider={provider}, client_id={client_id}")

        try:
            # Allauth's default logic for finding the app
            apps = SocialApp.objects.on_site(request).filter(provider=provider)
            
            if client_id:
                apps = apps.filter(client_id=client_id)

            print(f"DEBUG (Adapter): Found {apps.count()} apps for provider '{provider}' and client_id '{client_id}'.")
            logger.info(f"Found {apps.count()} apps")

            for app in apps:
                print(f"DEBUG (Adapter): App ID: {app.id}, Name: {app.name}, Client ID: {app.client_id}, Sites: {list(app.sites.all())}")
                logger.info(
                    f"App: {app.name}, client_id: {app.client_id}, sites: {list(app.sites.all())}"
                )
            
            # This is the line that can still raise MultipleObjectsReturned or DoesNotExist
            return apps.get()

        except SocialApp.DoesNotExist:
            print(f"DEBUG (Adapter): SocialApp.DoesNotExist for provider '{provider}' and client_id '{client_id}'")
            logger.error(f"SocialApp.DoesNotExist for provider '{provider}' and client_id '{client_id}'")
            raise # Re-raise the original exception
        except SocialApp.MultipleObjectsReturned:
            print(f"DEBUG (Adapter): SocialApp.MultipleObjectsReturned for provider '{provider}' and client_id '{client_id}'")
            logger.error(f"SocialApp.MultipleObjectsReturned for provider '{provider}' and client_id '{client_id}'")
            raise # Re-raise the original exception
        except Exception as e:
            print(f"DEBUG (Adapter): Unexpected error in DebugSocialAccountAdapter.get_app: {e}")
            logger.error(f"Unexpected error in DebugSocialAccountAdapter.get_app: {e}")
            raise

