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

username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not all([username, email, password]):
    print("Warning: DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, or DJANGO_SUPERUSER_PASSWORD not set. Skipping superuser creation.", file=sys.stderr)
else:
    if not User.objects.filter(username=username).exists():
        print(f"Creating superuser '{username}'...")
        User.objects.create_superuser(username=username, email=email, password=password)
        print("Superuser created successfully.")
    else:
        print(f"Superuser '{username}' already exists. Skipping creation.")
