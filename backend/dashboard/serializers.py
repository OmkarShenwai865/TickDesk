from rest_framework import serializers
from tickets.models import Ticket
from assets.models import Asset


class RecentTicketSerializer(serializers.ModelSerializer):
    created_by  = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()
    status      = serializers.CharField(source='get_status_display')
    priority    = serializers.CharField(source='get_priority_display')

    class Meta:
        model  = Ticket
        fields = [
            'id', 'ticket_number', 'title',
            'priority', 'status',
            'created_by', 'assigned_to',
            'created_at',
        ]

    def get_created_by(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_assigned_to(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None


class RecentAssetSerializer(serializers.ModelSerializer):
    assigned_to = serializers.SerializerMethodField()
    status      = serializers.CharField(source='get_status_display')
    category    = serializers.CharField(source='get_category_display')

    class Meta:
        model  = Asset
        fields = [
            'id', 'asset_tag', 'asset_name',
            'category', 'assigned_to',
            'status', 'purchase_date',
        ]

    def get_assigned_to(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
