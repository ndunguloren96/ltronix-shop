# create_initial_superuser.py
import os
import django
from django.conf import settings
from django.contrib.auth import get_user_model
import sys

# Configure Django settings (important for standalone scripts)
# Make sure this matches your project's main settings module path
# e.g., 'ecommerce.settings' if your settings.py is in ecommerce/ecommerce/settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')
django.setup()

User = get_user_model()

# Use EMAIL for all operations since 'username' field does not exist
# However, the create_superuser method seems to still require a 'username' argument.
# We will pass the email as the username to satisfy this requirement.
superuser_email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not all([superuser_email, superuser_password]):
    print("Warning: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set. Skipping superuser creation.", file=sys.stderr)
else:
    # Check if a user with this email already exists
    # Filter by 'email' because that's the unique field on your User model
    if not User.objects.filter(email=superuser_email).exists():
        print(f"Creating superuser with email '{superuser_email}'...")
        try:
            # The error "missing 1 required positional argument: 'username'" indicates
            # that the create_superuser method being called still expects a 'username'.
            # We will pass the email as the username to fulfill this requirement.
            User.objects.create_superuser(
                username=superuser_email, # <--- ADDED THIS LINE TO SATISFY THE ERROR
                email=superuser_email,
                password=superuser_password
                # Add any other required fields for your custom User model here if necessary,
                # e.g., first_name='Admin', last_name='User'
            )
            print("Superuser created successfully.")
        except Exception as e:
            print(f"Error creating superuser: {e}", file=sys.stderr)
    else:
        print(f"Superuser with email '{superuser_email}' already exists. Skipping creation.")

