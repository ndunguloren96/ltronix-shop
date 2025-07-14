# ecommerce/Dockerfile
FROM python:3.10-slim-buster

ENV PYTHONUNBUFFERED 1
ENV PIP_DEFAULT_TIMEOUT=1000

# Use a more recent and supported Python base image (Debian Bookworm - Debian 12).
# This resolves the 'buster Release 404 Not Found' error during apt-get update.
FROM python:3.10-slim-bookworm

# Set environment variables for Python
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for psycopg2 (PostgreSQL client library) and git
# libpq-dev is for PostgreSQL client libraries (needed for psycopg2)
# gcc is for compiling C extensions (like some Python packages might require)
# git is often useful for cloning private dependencies or during builds
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev git && \
    rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non-root user and set permissions
# 'appuser' is a good default non-root user name
RUN adduser --system --group appuser && \
    mkdir -p /app/ecommerce/staticfiles /app/ecommerce/media && \
    chown -R appuser:appuser /app

# Switch to the non-root user for subsequent commands
USER appuser

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
# If you want to use a default port for local Docker builds that can be overridden, you can do:
ARG PORT=8000
ENV PORT=${PORT}

# Run collectstatic as the appuser
# This command needs to be run after all Django code is copied.
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Command to run the application
# It first runs migrations, then creates a superuser (if not exists), then starts Gunicorn.
# The $PORT variable will be automatically provided by Render.
CMD ["sh", "-c", "python manage.py migrate --noinput && python create_initial_superuser.py && gunicorn ecommerce.wsgi:application --bind 0.0.0.0:$PORT"]


WORKDIR /app

# Install system dependencies required for psycopg2 and other packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev git && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a non-root user and set permissions
RUN adduser --system --group appuser && \
    mkdir -p /app/ecommerce/staticfiles /app/ecommerce/media && \
    chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Accept the build arguments and set them as environment variables during the build
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

# Run collectstatic as the appuser
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Run migrations and then start the Gunicorn server
CMD ["sh", "-c", "python manage.py migrate --noinput && python create_initial_superuser.py && gunicorn ecommerce.wsgi:application --bind 0.0.0.0:$PORT"]
