from django.contrib import admin
from .models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display    = ('asset_tag', 'asset_name', 'category', 'status', 'company', 'assigned_to', 'purchase_date')
    list_filter     = ('status', 'category', 'company')
    search_fields   = ('asset_tag', 'asset_name')
    readonly_fields = ('created_at', 'updated_at')
