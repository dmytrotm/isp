#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "--- Starting Entrypoint Script ---"

echo "Running migrations..."
# 1. Ensure migrations are up to date for the api app
python manage.py makemigrations api

# 2. Migrate the api app first (essential for custom User model with admin app)
echo "Migrating api app..."
python manage.py migrate api

# 3. Run all other migrations
echo "Migrating all apps..."
python manage.py migrate

# 4. Auto-populate database if it's a fresh install
echo "Checking if database needs population..."
USER_COUNT=$(python << END
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from api.models import User
try:
    print(User.objects.count())
except:
    print("-1")
END
)

if [ "$USER_COUNT" -eq "0" ]; then
    echo "Database is empty. Populating with sample data..."
    python manage.py populate_db --customers 50 --staff 10
elif [ "$USER_COUNT" -eq "-1" ]; then
    echo "Error checking user count. Skipping population."
else
    echo "Database already has $USER_COUNT users. Skipping population."
fi

echo "--- Setup Complete. Starting Server ---"
exec python manage.py runserver 0.0.0.0:8000
