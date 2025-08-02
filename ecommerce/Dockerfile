# ecommerce/Dockerfile

# Use a more recent and supported Python base image (Debian Bookworm - Debian 12).
FROM python:3.10-slim-bookworm

# Set environment variables for Python
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Define where the virtual environment will be created and ensure it's on the PATH
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# These commands MUST run as root (default user in Dockerfile at this point).
RUN set -eux; \
    apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev git && \
    rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Create a virtual environment and install Python dependencies into it
# This step still runs as root to create the venv (usually in /opt or /usr/local)
# and install packages into it.
RUN set -eux; \
    python3 -m venv $VIRTUAL_ENV && \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code *before* switching user
# This ensures all application files are present before changing ownership.
COPY . /app/

# Create a non-root user and set permissions for /app and the virtual environment
# Ensure the non-root user (appuser) owns the application directory and the virtual environment.
# FIX: Ensure chown -R appuser:appuser /app runs AFTER COPY . /app/
RUN set -eux; \
    adduser --system --group appuser && \
    mkdir -p /app/ecommerce/staticfiles /app/ecommerce/media && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser $VIRTUAL_ENV # IMPORTANT: Give appuser ownership of the venv

# Switch to the non-root user for subsequent commands
USER appuser


# Environment variables (build-args) for build time.
# For production, these should be securely set as environment variables in your hosting platform.
ARG DJANGO_SECRET_KEY=a_temporary_secret_key_for_development_only
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

# The $PORT environment variable is usually automatically set by Render.
# Defining it as ARG/ENV here allows for local Docker builds.
ARG PORT=8000
ENV PORT=${PORT}

# Run collectstatic using the virtual environment's python.
# The `PATH` environment variable (set at the top) ensures `python` refers to the venv's Python.
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Command to run the application (superuser creation, then Gunicorn)
# `python` here also refers to the venv's python due to the PATH setting.
CMD ["sh", "-c", "python create_initial_superuser.py && gunicorn ecommerce.wsgi:application --bind 0.0.0.0:$PORT"]
