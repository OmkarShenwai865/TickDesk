from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.db.models import Count, Q
from .models import Department, Company
from assets.models import Asset


class CompanySerializer(serializers.ModelSerializer):
    # Plain CharField so we can normalize (prepend https://) before Django's
    # URL validator runs, instead of the auto-generated URLField rejecting
    # bare domains like "www.example.com" outright.
    website = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = Company
        fields = ['id', 'name', 'support_email', 'website', 'timezone', 'date_format']
        read_only_fields = ['id']

    def validate_website(self, value):
        value = value.strip()
        if not value:
            return value
        if not value.startswith(('http://', 'https://')):
            value = f'https://{value}'
        try:
            URLValidator()(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Enter a valid URL.')
        return value


class DepartmentListSerializer(serializers.ModelSerializer):
    dept_id            = serializers.SerializerMethodField()
    head_name          = serializers.SerializerMethodField()
    head_initials      = serializers.SerializerMethodField()
    employees_count    = serializers.IntegerField(read_only=True)
    assets_count       = serializers.IntegerField(read_only=True)
    open_tickets_count = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Department
        fields = [
            'id', 'dept_id', 'name', 'description', 'location',
            'head', 'head_name', 'head_initials',
            'employees_count', 'assets_count', 'open_tickets_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_dept_id(self, obj):
        return f"DEP-{obj.id:03d}"

    def get_head_name(self, obj):
        if obj.head:
            return obj.head.get_full_name() or obj.head.username
        return None

    def get_head_initials(self, obj):
        name = self.get_head_name(obj)
        if not name:
            return "—"
        parts = name.split()
        return "".join(p[0] for p in parts[:2]).upper()


class DepartmentDetailSerializer(DepartmentListSerializer):
    asset_distribution = serializers.SerializerMethodField()

    class Meta(DepartmentListSerializer.Meta):
        fields = DepartmentListSerializer.Meta.fields + ['asset_distribution']

    _CATEGORY_LABELS = {
        'laptop': 'Laptops', 'desktop': 'Desktops', 'printer': 'Printers',
        'monitor': 'Monitors', 'networking': 'Networking', 'server': 'Servers', 'other': 'Other',
    }

    def get_asset_distribution(self, obj):
        qs = (
            Asset.objects
            .filter(department=obj)
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return [
            {'category': self._CATEGORY_LABELS.get(r['category'], r['category']), 'count': r['count']}
            for r in qs
        ]
