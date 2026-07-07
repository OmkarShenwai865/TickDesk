from django.db import models
from django.conf import settings
from accounts.models import Company, Department


class Ticket(models.Model):
    PRIORITY_LOW      = 'low'
    PRIORITY_MEDIUM   = 'medium'
    PRIORITY_HIGH     = 'high'
    PRIORITY_CRITICAL = 'critical'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW,      'Low'),
        (PRIORITY_MEDIUM,   'Medium'),
        (PRIORITY_HIGH,     'High'),
        (PRIORITY_CRITICAL, 'Critical'),
    ]

    STATUS_OPEN        = 'open'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_RESOLVED    = 'resolved'
    STATUS_CLOSED      = 'closed'

    STATUS_CHOICES = [
        (STATUS_OPEN,        'Open'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_RESOLVED,    'Resolved'),
        (STATUS_CLOSED,      'Closed'),
    ]

    company       = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tickets')
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    title         = models.CharField(max_length=500)
    description   = models.TextField(blank=True)
    priority      = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_tickets',
    )
    assigned_to   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_tickets',
    )
    department    = models.ForeignKey(
        Department, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tickets',
    )
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            import datetime
            year  = datetime.date.today().year
            count = Ticket.objects.filter(company=self.company).count() + 1
            self.ticket_number = f"TKT-{year}-{count:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number}: {self.title}"


def attachment_upload_path(instance, filename):
    return f"ticket_attachments/{instance.ticket.ticket_number}/{filename}"


class TicketAttachment(models.Model):
    ticket       = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='attachments')
    file         = models.FileField(upload_to=attachment_upload_path)
    original_name = models.CharField(max_length=255)
    file_size    = models.PositiveIntegerField(help_text="Size in bytes")
    uploaded_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='uploaded_attachments',
    )
    uploaded_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']

    def __str__(self):
        return f"{self.original_name} → {self.ticket.ticket_number}"


class TicketComment(models.Model):
    ticket     = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='ticket_comments',
    )
    text       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment on {self.ticket.ticket_number} by {self.author}"


class TicketActivity(models.Model):
    ticket     = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='activities')
    actor      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='ticket_activities',
    )
    action     = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ticket.ticket_number}: {self.action}"
