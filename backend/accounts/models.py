from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import secrets


class Company(models.Model):
    name          = models.CharField(max_length=255)
    support_email = models.EmailField(blank=True)
    website       = models.URLField(blank=True)
    timezone      = models.CharField(max_length=50, blank=True, default="GMT+0")
    date_format   = models.CharField(max_length=20, blank=True, default="MM/DD/YYYY")
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_ADMIN      = 'admin'
    ROLE_AGENT      = 'agent'
    ROLE_EMPLOYEE   = 'employee'
    ROLE_SUPERADMIN = 'superadmin'

    ROLE_CHOICES = [
        (ROLE_ADMIN,      'Admin'),
        (ROLE_AGENT,      'Agent'),
        (ROLE_EMPLOYEE,   'Employee'),
        (ROLE_SUPERADMIN, 'Super Admin'),
    ]

    STATUS_ACTIVE   = 'active'
    STATUS_BUSY     = 'busy'
    STATUS_INACTIVE = 'inactive'
    STATUS_CHOICES  = [
        (STATUS_ACTIVE,   'Active'),
        (STATUS_BUSY,     'Busy'),
        (STATUS_INACTIVE, 'Inactive'),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE,
        related_name='users', null=True, blank=True,
    )
    department = models.ForeignKey(
        'Department', on_delete=models.SET_NULL,
        related_name='users', null=True, blank=True,
    )
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    location   = models.CharField(max_length=100, blank=True)
    reports_to = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='subordinates',
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Department(models.Model):
    company     = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name        = models.CharField(max_length=255)
    head        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='headed_departments',
    )
    location    = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} — {self.company.name}"


class UserInvitation(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_EXPIRED = 'expired'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='user_invitations')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES, default=User.ROLE_EMPLOYEE)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, related_name='user_invitations', null=True, blank=True,
    )
    location = models.CharField(max_length=100, blank=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='sent_user_invitations', null=True, blank=True,
    )
    token = models.CharField(max_length=96, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    expires_at = models.DateTimeField()
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='accepted_user_invitations', null=True, blank=True,
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'email', 'status']),
            models.Index(fields=['token']),
        ]

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"{self.email} invitation ({self.status})"
