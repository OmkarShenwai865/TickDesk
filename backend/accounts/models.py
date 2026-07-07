from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class Company(models.Model):
    name       = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_ADMIN    = 'admin'
    ROLE_AGENT    = 'agent'
    ROLE_EMPLOYEE = 'employee'

    ROLE_CHOICES = [
        (ROLE_ADMIN,    'Admin'),
        (ROLE_AGENT,    'Agent'),
        (ROLE_EMPLOYEE, 'Employee'),
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
