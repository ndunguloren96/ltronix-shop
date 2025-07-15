# ecommerce/Dockerfile

# Use a more recent and supported Python base image (Debian Bookworm - Debian 12).
# This resolves the 'buster Release 404 Not Found' error during apt-get update.
FROM python:3.10-slim-bookworm

# Set environment variables for Python
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for psycopg2 (PostgreSQL client library) and git
# These commands MUST run as root (default user in Dockerfile at this point).
RUN set -eux; \
    apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev git && \
    rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
# These commands also typically require root privileges or a writable environment.
RUN set -eux; \
    pip install --no-cache-dir -r requirements.txt; \
    pip freeze # FIX: Add pip freeze to inspect installed packages

# Create a non-root user and set permissions
# This should happen AFTER all system and pip installs that require root.
RUN set -eux; \
    adduser --system --group appuser && \
    mkdir -p /app/ecommerce/staticfiles /app/ecommerce/media && \
    chown -R appuser:appuser /app

# Switch to the non-root user for subsequent commands
# All commands after this will run as 'appuser'.
USER appuser

# Copy the rest of the application code
# This should happen after user creation and permission setting, so appuser owns the code.
COPY . /app/

# Accept the build arguments and set them as environment variables during the build
# These ARG values will be passed during the `docker build` command.
# For production, these should be set as environment variables in your hosting platform (e.g., Render).
ARG DJANGO_SECRET_KEY
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
ARG SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
ENV SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=${SOCIAL_AUTH_GOOGLE_OAUTH2_KEY}
ARG SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET
ENV SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=${SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET}
ARG MPESA_CONSUMER_KEY
ENV MPESA_CONSUMER_KEY=${MPESA_CONSUMER_KEY}
ARG MPESA_CONSUMER_SECRET
ENV MPESA_CONSUMER_SECRET=${MPESA_CONSUMER_SECRET}
ARG MPESA_EXPRESS_SHORTCODE
ENV MPESA_EXPRESS_SHORTCODE=${MPESA_EXPRESS_SHORTCODE}
ARG MPESA_PASSKEY
ENV MPESA_PASSKEY=${MPESA_PASSKEY}
ARG MPESA_ENV
ENV MPESA_ENV=${MPESA_ENV}
ARG MPESA_SHORTCODE
ENV MPESA_SHORTCODE=${MPESA_SHORTCODE}
ARG MPESA_CALLBACK_URL
ENV MPESA_CALLBACK_URL=${MPESA_CALLBACK_URL}
ARG SENTRY_DSN
ENV SENTRY_DSN=${SENTRY_DSN}
ARG DEFAULT_FROM_EMAIL
ENV DEFAULT_FROM_EMAIL=${DEFAULT_FROM_EMAIL}
ARG SENDGRID_API_KEY
ENV SENDGRID_API_KEY=${SENDGRID_API_KEY}

# Add database arguments
ARG DATABASE_USER
ENV DATABASE_USER=${DATABASE_USER}
ARG DATABASE_PASSWORD
ENV DATABASE_PASSWORD=${DATABASE_PASSWORD}
ARG DATABASE_HOST
ENV DATABASE_HOST=${DATABASE_HOST}
ARG DATABASE_PORT
ENV DATABASE_PORT=${DATABASE_PORT}
ARG DATABASE_NAME
ENV DATABASE_NAME=${DATABASE_NAME}

# IMPORTANT: For Render, the $PORT environment variable is automatically set by the platform.
# You don't need to define it as an ARG here unless you specifically want to control it during local Docker builds.
ARG PORT=8000
ENV PORT=${PORT}

# Run collectstatic as the appuser (now that we've switched to appuser)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Command to run the application
# It first runs migrations, then creates a superuser (if not exists), then starts Gunicorn.
# The $PORT variable will be automatically provided by Render.
CMD ["sh", "-c", "python manage.py migrate --noinput && python create_initial_superuser.py && gunicorn ecommerce.wsgi:application --bind 0.0.0.0:$PORT"]
