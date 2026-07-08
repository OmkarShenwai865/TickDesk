from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Company, User, Department, UserInvitation


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display  = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('TickDesk', {'fields': ('company', 'role')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('TickDesk', {'fields': ('company', 'role')}),
    )
    list_display   = ('username', 'email', 'role', 'company', 'is_staff')
    list_filter    = ('role', 'company')
    search_fields  = ('username', 'email')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display  = ('name', 'company', 'created_at')
    list_filter   = ('company',)
    search_fields = ('name',)


@admin.register(UserInvitation)
class UserInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'company', 'status', 'expires_at', 'created_at')
    list_filter = ('status', 'role', 'company')
    search_fields = ('email',)
    readonly_fields = ('token', 'created_at', 'accepted_at')
