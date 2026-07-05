from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    created_by_name  = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    department_name  = serializers.SerializerMethodField()
    status_display   = serializers.CharField(source='get_status_display',   read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model  = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description',
            'priority', 'priority_display',
            'status',   'status_display',
            'created_by',  'created_by_name',
            'assigned_to', 'assigned_to_name',
            'department',  'department_name',
            'created_at',  'updated_at',
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None
