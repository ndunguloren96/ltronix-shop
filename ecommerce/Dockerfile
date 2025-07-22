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
    apt-get update &&     apt-get install -y --no-install-recommends gcc libpq-dev git postgresql-client &&
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

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create a non-root user and set permissions for /app and the virtual environment
# Ensure the non-root user (appuser) owns the application directory and the virtual environment.
RUN set -eux; \
    adduser --system --group appuser && \
    mkdir -p /app/ecommerce/staticfiles /app/ecommerce/media && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser $VIRTUAL_ENV # IMPORTANT: Give appuser ownership of the venv

# Switch to the non-root user for subsequent commands
USER appuser

# Copy the rest of the application code
# This should happen after user creation and permission setting, so appuser owns the code.
COPY . /app/

# Environment variables (build-args) for build time.
# For production, these should be securely set as environment variables in your hosting platform.
ARG DJANGO_SECRET_KEY
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}

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

# IMPORTANT FIX: Move collectstatic to after migrations in CMD,
# or ensure migrations run before collectstatic if it's a separate RUN step.
# For simplicity and ensuring tables exist, it's best to run migrations
# before collectstatic if collectstatic depends on database models.
# However, for Render, it's common to run migrations as part of the start command.
# The error indicates collectstatic is trying to access the DB during build.
# The `create_initial_superuser.py` script definitely needs migrations to be applied.

# Option 1 (Recommended for Render): Remove collectstatic from RUN, and handle it in CMD
# This is often done when the build process (like Render's) handles collectstatic
# as part of a pre-deploy hook or the start command.
# Given your existing CMD already runs migrations and superuser creation,
# it's best to move collectstatic there too if it's causing issues during build.
# If collectstatic *must* run as a separate build step, then migrations must run before it.


EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]

# Command to run the application (migrations, superuser creation, then Gunicorn)
# Now, collectstatic is run after migrations, ensuring database tables exist.
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python create_initial_superuser.py && gunicorn ecommerce.wsgi:application --bind 0.0.0.0:$PORT"]
