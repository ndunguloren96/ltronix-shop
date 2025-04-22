import uuid
import re
from datetime import datetime
from django.core.mail import send_mail as django_send_mail

def generate_order_id():
    """Generate a unique order ID."""
    return str(uuid.uuid4()).replace("-", "")[:12].upper()

def validate_email(email):
    """Simple email validation."""
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(pattern, email) is not None

def format_date(dt, fmt="%Y-%m-%d %H:%M"):
    """Format a datetime object as a string."""
    if not isinstance(dt, datetime):
        return ""
    return dt.strftime(fmt)

def send_email(subject, message, recipient, from_email=None):
    """Send an email using Django's send_mail."""
    return django_send_mail(subject, message, from_email, [recipient])
