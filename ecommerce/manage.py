#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
VENV_PATH = BASE_DIR.parent / ".venv"
SITE_PACKAGES_PATH = (
    VENV_PATH
    / "lib"
    / f"python{sys.version_info.major}.{sys.version_info.minor}"
    / "site-packages"
)

if str(SITE_PACKAGES_PATH) not in sys.path:
    sys.path.insert(0, str(SITE_PACKAGES_PATH))


def main():
    """Run administrative tasks."""
    # --- CHANGE THIS LINE ---
    # Original: os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')
    # Change to explicitly load the development settings file
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings.development")
    # --- END CHANGE ---

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
