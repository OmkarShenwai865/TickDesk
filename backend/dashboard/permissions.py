from rest_framework.permissions import BasePermission


class IsCompanyAdmin(BasePermission):
    """Allow access only to authenticated admin users who belong to a company."""
    message = "Only Company Admins can access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
            and getattr(user, 'company_id', None) is not None
        )


class IsCompanyMember(BasePermission):
    """Any authenticated user (admin, agent, employee) who belongs to a company."""
    message = "You must be a member of a company to access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and getattr(user, 'company_id', None) is not None
        )


class IsAgentOrAdmin(BasePermission):
    """Authenticated agents or admins only."""
    message = "Only agents or admins can access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and getattr(user, 'role', None) in ('agent', 'admin')
            and getattr(user, 'company_id', None) is not None
        )
