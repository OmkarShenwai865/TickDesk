from django.db import models
from django.conf import settings
from accounts.models import Company, Department


class Asset(models.Model):
    CATEGORY_LAPTOP     = 'laptop'
    CATEGORY_DESKTOP    = 'desktop'
    CATEGORY_PRINTER    = 'printer'
    CATEGORY_MONITOR    = 'monitor'
    CATEGORY_NETWORKING = 'networking'
    CATEGORY_SERVER     = 'server'
    CATEGORY_OTHER      = 'other'

    CATEGORY_CHOICES = [
        (CATEGORY_LAPTOP,     'Laptop'),
        (CATEGORY_DESKTOP,    'Desktop'),
        (CATEGORY_PRINTER,    'Printer'),
        (CATEGORY_MONITOR,    'Monitor'),
        (CATEGORY_NETWORKING, 'Networking'),
        (CATEGORY_SERVER,     'Server'),
        (CATEGORY_OTHER,      'Other'),
    ]

    STATUS_AVAILABLE   = 'available'
    STATUS_ASSIGNED    = 'assigned'
    STATUS_MAINTENANCE = 'maintenance'
    STATUS_RETIRED     = 'retired'

    STATUS_CHOICES = [
        (STATUS_AVAILABLE,   'Available'),
        (STATUS_ASSIGNED,    'Assigned'),
        (STATUS_MAINTENANCE, 'Maintenance'),
        (STATUS_RETIRED,     'Retired'),
    ]

    company       = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='assets')
    asset_tag     = models.CharField(max_length=50)
    asset_name    = models.CharField(max_length=255)
    category      = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_AVAILABLE)
    assigned_to   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_assets',
    )
    department    = models.ForeignKey(
        Department, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assets',
    )
    purchase_date = models.DateField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering       = ['-created_at']
        unique_together = [['company', 'asset_tag']]

    def __str__(self):
        return f"{self.asset_tag}: {self.asset_name}"
