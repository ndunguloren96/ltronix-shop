import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from anymail.exceptions import AnymailError

from .tasks import send_email_task

logger = logging.getLogger(__name__)

def _send_email_with_template(subject, template_name, context, to_email, from_email=None):
    """
    Helper function to render a Django template and send an email.
    """
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    html_content = render_to_string(template_name, context)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=html_content, # Fallback for plain text clients
        from_email=from_email,
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")

    try:
        msg.send()
        logger.info(f"Email '{subject}' sent successfully to {to_email}")
        return True
    except AnymailError as e:
        logger.error(f"Anymail error sending email '{subject}' to {to_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"General error sending email '{subject}' to {to_email}: {e}")
        return False

def send_verification_email(to_email, code, expiry):
    subject = "Ltronix Shop: Email Verification Code"
    template_name = "emails/verification_email.html"
    context = {
        "verification_code": code,
        "expiry_minutes": expiry,
    }
    send_email_task.delay(subject, template_name, context, to_email)
    logger.info(f"Verification email task queued for {to_email}")

def send_order_confirmation(to_email, order_details):
    subject = f"Ltronix Shop: Order #{order_details['id']} Confirmation"
    template_name = "emails/order_confirmation.html"
    context = {"order": order_details}
    send_email_task.delay(subject, template_name, context, to_email)
    logger.info(f"Order confirmation email task queued for {to_email}")

def send_payment_receipt(to_email, order_details):
    subject = f"Ltronix Shop: Payment Receipt for Order #{order_details['id']}"
    template_name = "emails/payment_receipt.html"
    context = {"order": order_details}
    send_email_task.delay(subject, template_name, context, to_email)
    logger.info(f"Payment receipt email task queued for {to_email}")
