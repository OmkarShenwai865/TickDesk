from rest_framework import serializers
from .models import Asset


class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name    = serializers.SerializerMethodField()
    assigned_to_email   = serializers.SerializerMethodField()
    assigned_to_emp_id  = serializers.SerializerMethodField()
    department_name     = serializers.SerializerMethodField()
    status_display      = serializers.CharField(source='get_status_display',   read_only=True)
    category_display    = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Asset
        fields = [
            'id', 'asset_tag', 'asset_name',
            'category', 'category_display',
            'status',   'status_display',
            'assigned_to', 'assigned_to_name', 'assigned_to_email', 'assigned_to_emp_id',
            'department', 'department_name',
            'purchase_date', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'asset_tag', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_assigned_to_email(self, obj):
        return obj.assigned_to.email if obj.assigned_to else None

    def get_assigned_to_emp_id(self, obj):
        if obj.assigned_to:
            return f"TD-{obj.assigned_to.id:04d}"
        return None

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None
