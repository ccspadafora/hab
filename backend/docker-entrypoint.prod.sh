#!/bin/sh
set -e

mkdir -p /app/staticfiles
chown -R nonroot:nonroot /app/staticfiles

run_as_nonroot() {
    su -s /bin/sh nonroot -c "$1"
}

echo "Running migrations..."
run_as_nonroot "python manage.py migrate --noinput"

echo "Collecting static files..."
run_as_nonroot "python manage.py collectstatic --noinput"

echo "Starting gunicorn..."
exec su -s /bin/sh nonroot -c "gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class gthread \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -"
