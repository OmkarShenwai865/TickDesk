#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser automatically if it doesn't exist
python manage.py shell << EOF
from accounts.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'omkarshenwai322@gmail.com', 'Omkar@Admin')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
EOF
