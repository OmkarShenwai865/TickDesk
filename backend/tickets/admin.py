from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display    = ('ticket_number', 'title', 'status', 'priority', 'company', 'created_by', 'assigned_to', 'created_at')
    list_filter     = ('status', 'priority', 'company')
    search_fields   = ('ticket_number', 'title')
    readonly_fields = ('ticket_number', 'created_at', 'updated_at')
