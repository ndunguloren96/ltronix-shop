#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for the database to be available.
# This is a simple loop that tries to connect to the database.
# A more robust solution might use a tool like `wait-for-it.sh`.
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - continuing"

# Apply database migrations.
python manage.py migrate --noinput

# Start the main application.
exec "$@"
