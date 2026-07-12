from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allow access only to authenticated Master Admin (superadmin) users."""
    message = "Only the Master Admin can access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and getattr(user, 'role', None) == 'superadmin'
        )
