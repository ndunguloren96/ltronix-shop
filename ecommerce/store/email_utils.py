import logging

from anymail.exceptions import AnymailError
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger("anymail")


def send_order_confirmation_email(order, to_email):
    """
    Sends an order confirmation email to the user.
    """
    subject = f"Your Order #{order.id} Confirmation - Ltronix Shop"
    context = {"order": order}
    html_content = render_to_string("emails/order_confirmation.html", context)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=html_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
        logger.info(f"Order confirmation email sent to {to_email} for order {order.id}")
        return True
    except AnymailError as e:
        logger.error(f"Anymail error sending order confirmation: {e}")
        return False
    except Exception as e:
        logger.error(f"General error sending order confirmation: {e}")
        return False


def send_payment_receipt_email(order, to_email):
    """
    Sends a payment receipt email to the user.
    """
    subject = f"Payment Receipt for Order #{order.id} - Ltronix Shop"
    context = {"order": order}
    html_content = render_to_string("emails/payment_receipt.html", context)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=html_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
        logger.info(f"Payment receipt email sent to {to_email} for order {order.id}")
        return True
    except AnymailError as e:
        logger.error(f"Anymail error sending payment receipt: {e}")
        return False
    except Exception as e:
        logger.error(f"General error sending payment receipt: {e}")
        return False
