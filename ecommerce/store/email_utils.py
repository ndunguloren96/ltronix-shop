import logging
from django.conf import settings

from emails.services import send_order_confirmation, send_payment_receipt

logger = logging.getLogger("anymail")

def send_order_confirmation_email(order, to_email):
    """
    Sends an order confirmation email to the user.
    """
    # Prepare order details for serialization
    order_details = {
        'id': order.id,
        'customer_name': order.customer.name if order.customer else 'Guest',
        'get_cart_total': str(order.get_cart_total),
        'items': [{
            'product_name': item.product.name,
            'quantity': item.quantity,
            'get_total': str(item.get_total)
        } for item in order.orderitem_set.all()]
    }
    send_order_confirmation(to_email, order_details)
    logger.info(f"Order confirmation email task queued for {to_email}")
    return True

def send_payment_receipt_email(order, to_email):
    """
    Sends a payment receipt email to the user.
    """
    # Prepare order details for serialization
    order_details = {
        'id': order.id,
        'customer_name': order.customer.name if order.customer else 'Guest',
        'get_cart_total': str(order.get_cart_total),
        'items': [{
            'product_name': item.product.name,
            'quantity': item.quantity,
            'get_total': str(item.get_total)
        } for item in order.orderitem_set.all()]
    }
    send_payment_receipt(to_email, order_details)
    logger.info(f"Payment receipt email task queued for {to_email}")
    return True