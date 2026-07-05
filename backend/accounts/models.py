from django.db import models
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

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Department(models.Model):
    company    = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name       = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} — {self.company.name}"
