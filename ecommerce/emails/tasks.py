from celery import shared_task
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from anymail.exceptions import AnymailError

logger = logging.getLogger(__name__)

@shared_task(bind=True, retry_backoff=True)
def send_email_task(self, subject, template_name, context, to_email, from_email=None):
    """
    Celery task to send an email asynchronously.
    """
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    try:
        html_content = render_to_string(template_name, context)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=html_content, # Fallback for plain text clients
            from_email=from_email,
            to=[to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"Celery task: Email '{subject}' sent successfully to {to_email}")
        return True
    except AnymailError as e:
        logger.error(f"Celery task: Anymail error sending email '{subject}' to {to_email}: {e}")
        raise self.retry(exc=e, countdown=60) # Retry after 60 seconds
    except Exception as e:
        logger.error(f"Celery task: General error sending email '{subject}' to {to_email}: {e}")
        raise self.retry(exc=e, countdown=60) # Retry after 60 seconds
