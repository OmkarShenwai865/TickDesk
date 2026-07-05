from rest_framework.permissions import BasePermission


class IsCompanyAdmin(BasePermission):
    """
    Allow access only to authenticated users with role='admin'
    who belong to a company.
    """
    message = "Only Company Admins can access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
            and getattr(user, 'company_id', None) is not None
        )
