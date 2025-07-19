# create_initial_superuser.py
import os
import django
from django.conf import settings
from django.contrib.auth import get_user_model
import sys
import time
from django.db.utils import OperationalError, ProgrammingError

# Configure Django settings (important for standalone scripts)
# Make sure this matches your project's main settings module path
# e.g., 'ecommerce.settings' if your settings.py is in ecommerce/ecommerce/settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')

# Number of retries and delay for database connection
MAX_RETRIES = 10
RETRY_DELAY_SECONDS = 5

for attempt in range(MAX_RETRIES):
    try:
        django.setup()
        break # If setup succeeds, exit the loop
    except (OperationalError, ProgrammingError) as e:
        print(f"Database not ready (attempt {attempt + 1}/{MAX_RETRIES}): {e}", file=sys.stderr)
        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_DELAY_SECONDS)
        else:
            print("Max retries reached. Could not connect to the database. Exiting.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred during Django setup: {e}", file=sys.stderr)
        sys.exit(1)


User = get_user_model()

# Use EMAIL for all operations since 'username' field does not exist
superuser_email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not all([superuser_email, superuser_password]):
    print("Warning: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set. Skipping superuser creation.", file=sys.stderr)
else:
    # Add retry logic for database queries as well
    for attempt in range(MAX_RETRIES):
        try:
            if not User.objects.filter(email=superuser_email).exists():
                print(f"Creating superuser with email '{superuser_email}'...")
                User.objects.create_superuser(
                    email=superuser_email,
                    password=superuser_password
                )
                print("Superuser created successfully.")
            else:
                print(f"Superuser with email '{superuser_email}' already exists. Skipping creation.")
            break # If superuser check/creation succeeds, exit the loop
        except (OperationalError, ProgrammingError) as e:
            print(f"Database query failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}", file=sys.stderr)
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                print("Max retries reached. Could not perform superuser operations. Exiting.", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            print(f"An unexpected error occurred during superuser creation: {e}", file=sys.stderr)
            sys.exit(1)
