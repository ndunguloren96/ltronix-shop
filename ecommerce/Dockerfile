# Use an official Python runtime as a parent image
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# These are typically needed for building certain Python packages (like psycopg2-binary)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc meson \
    && rm -rf /var/lib/apt/lists/*

# Copy the production requirements file into the container
# Ensure requirements-prod.txt exists in your ecommerce directory
COPY requirements-prod.txt /app/requirements-prod.txt

# Install any needed packages specified in requirements-prod.txt
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy the rest of the application code into the container
# This copies everything from the build context (ecommerce/ in your Render setup)
COPY . /app

# Expose the port Gunicorn will run on (Render handles port mapping)
EXPOSE 8000

# Command to run the application using Gunicorn
# This matches the 'web' entry in your Procfile and Render's Start Command
CMD ["gunicorn", "ecommerce.wsgi:application", "--bind", "0.0.0.0:$PORT"]
