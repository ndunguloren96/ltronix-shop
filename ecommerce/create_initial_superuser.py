# create_initial_superuser.py
import os
import django
from django.conf import settings
from django.contrib.auth import get_user_model
import sys
import time
from django.db.utils import OperationalError, ProgrammingError
from django.db import connections

# Configure Django settings (important for standalone scripts)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')

# Number of retries and delay for database connection
MAX_RETRIES = 30 # Increased retries
RETRY_DELAY_SECONDS = 3 # Slightly reduced delay, but more attempts

def wait_for_database(db_conn_name='default', max_retries=MAX_RETRIES, delay=RETRY_DELAY_SECONDS):
    """Waits for the database connection to be ready."""
    for attempt in range(max_retries):
        try:
            connections[db_conn_name].ensure_connection()
            print(f"Database connection successful on attempt {attempt + 1}.", file=sys.stderr)
            return True
        except (OperationalError, ProgrammingError) as e:
            print(f"Database not ready (attempt {attempt + 1}/{max_retries}): {e}", file=sys.stderr)
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                print("Max retries reached. Could not connect to the database. Exiting.", file=sys.stderr)
                return False
        except Exception as e:
            print(f"An unexpected error occurred while waiting for database: {e}", file=sys.stderr)
            return False
    return False

# First, wait for the database connection to be established
if not wait_for_database():
    sys.exit(1) # Exit if database is not ready after max retries

# Then, setup Django
try:
    django.setup()
    print("Django setup completed successfully.", file=sys.stderr)
except Exception as e:
    print(f"Error during Django setup: {e}", file=sys.stderr)
    sys.exit(1)

User = get_user_model()

superuser_email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not all([superuser_email, superuser_password]):
    print("Warning: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set. Skipping superuser creation.", file=sys.stderr)
else:
    # Add retry logic for superuser creation/check
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
            print(f"Database query failed during superuser creation (attempt {attempt + 1}/{MAX_RETRIES}): {e}", file=sys.stderr)
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                print("Max retries reached. Could not perform superuser operations. Exiting.", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            print(f"An unexpected error occurred during superuser creation: {e}", file=sys.stderr)
            sys.exit(1)


