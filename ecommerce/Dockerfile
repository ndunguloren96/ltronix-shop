# ecommerce/Dockerfile
FROM python:3.10-slim-buster

ENV PYTHONUNBUFFERED 1
ENV PIP_DEFAULT_TIMEOUT=1000

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
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn ecommerce.wsgi:application --bind 0.0.0.0:$PORT"]
