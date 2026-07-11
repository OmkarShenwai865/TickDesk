from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_TICKET_ASSIGNED = 'ticket_assigned'
    TYPE_TICKET_STATUS   = 'ticket_status'
    TYPE_TICKET_COMMENT  = 'ticket_comment'
    TYPE_ASSET_ASSIGNED  = 'asset_assigned'

    recipient  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notif_type = models.CharField(max_length=40)
    title      = models.CharField(max_length=255)
    body       = models.CharField(max_length=500, blank=True)
    link       = models.CharField(max_length=200, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
