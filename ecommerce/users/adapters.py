# users/adapters.py
import logging

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

logger = logging.getLogger(__name__)


class DebugSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_app(self, request, provider, client_id=None):
        from allauth.socialaccount.models import SocialApp

        logger.info(f"Searching for app: provider={provider}, client_id={client_id}")
        apps = SocialApp.objects.filter(provider=provider)
        logger.info(f"Found {apps.count()} apps")
        for app in apps:
            logger.info(
                f"App: {app.name}, client_id: {app.client_id}, sites: {list(app.sites.all())}"
            )
        return super().get_app(request, provider, client_id)
