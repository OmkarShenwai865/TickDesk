from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from accounts.models import User


class Command(BaseCommand):
    help = "Create a Master Admin (superadmin) account — a platform-level login with no company."

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', required=True)
        parser.add_argument('--first-name', default='Master')
        parser.add_argument('--last-name', default='Admin')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        password = options['password']

        if User.objects.filter(email=email).exists():
            raise CommandError(f'A user with email "{email}" already exists.')

        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise CommandError(' '.join(e.messages))

        base = email.split('@')[0].replace('.', '_')
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{suffix}"
            suffix += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=options['first_name'],
            last_name=options['last_name'],
            role=User.ROLE_SUPERADMIN,
            company=None,
            is_staff=True,
        )

        self.stdout.write(self.style.SUCCESS(
            f'Master admin created: {user.email} (username: {user.username})'
        ))
