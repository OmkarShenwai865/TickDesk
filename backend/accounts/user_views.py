from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import User, Department
from dashboard.permissions import IsCompanyAdmin
from assets.models import Asset
from assets.serializers import AssetSerializer

PAGE_SIZE = 10

AVATAR_COLORS = [
    '#2563eb', '#16a34a', '#ea580c', '#7c3aed',
    '#0891b2', '#be185d', '#b45309', '#4f46e5',
]


def _user_to_dict(u, index=None):
    full = u.get_full_name() or u.username
    parts = full.split()
    initials = "".join(p[0] for p in parts[:2]).upper() if parts else "?"
    color = AVATAR_COLORS[(u.id - 1) % len(AVATAR_COLORS)]
    return {
        'id':            u.id,
        'name':          full,
        'email':         u.email,
        'initials':      initials,
        'avatar_color':  color,
        'emp_id':        f"TD-{u.id:04d}",
        'department':    u.department.name if u.department else None,
        'department_id': u.department_id,
        'role':          u.role,
        'role_display':  u.get_role_display(),
        'status':        u.status,
        'status_display': u.get_status_display(),
        'location':      u.location,
        'reports_to':    (
            u.reports_to.get_full_name() or u.reports_to.username
            if u.reports_to else None
        ),
    }


class UserStatsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = User.objects.filter(company=company)
        return Response({
            'total_users':     qs.count(),
            'active_users':    qs.filter(status='active').count(),
            'support_agents':  qs.filter(role='agent').count(),
            'administrators':  qs.filter(role='admin').count(),
        })


class UserRoleBreakdownView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = User.objects.filter(company=company)
        total = qs.count()
        rows = qs.values('role').annotate(count=Count('id')).order_by('-count')
        COLORS = {'admin': '#ef4444', 'agent': '#f97316', 'employee': '#3b82f6'}
        return Response([
            {
                'role':  r['role'],
                'label': r['role'].capitalize(),
                'count': r['count'],
                'pct':   round(r['count'] / total * 100) if total else 0,
                'color': COLORS.get(r['role'], '#6b7280'),
            }
            for r in rows
        ])


class UserDeptDistributionView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        total = User.objects.filter(company=company).count()
        rows = (
            Department.objects
            .filter(company=company)
            .annotate(count=Count('users'))
            .values('name', 'count')
            .order_by('-count')[:6]
        )
        return Response([
            {
                'label': r['name'],
                'count': r['count'],
                'pct':   round(r['count'] / total * 100) if total else 0,
            }
            for r in rows
        ])


class UserListView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = (
            User.objects
            .filter(company=company)
            .select_related('department', 'reports_to')
            .order_by('first_name', 'last_name', 'username')
        )

        role = request.query_params.get('role', '').strip()
        if role:
            qs = qs.filter(role=role)

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)       |
                Q(username__icontains=search)
            )

        total     = qs.count()
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(int(request.query_params.get('page_size', PAGE_SIZE)), 200)
        start     = (page - 1) * page_size

        return Response({
            'count':     total,
            'page':      page,
            'page_size': page_size,
            'results':   [_user_to_dict(u) for u in qs[start:start + page_size]],
        })

    def post(self, request):
        data = request.data
        errors = {}

        first_name = data.get('first_name', '').strip()
        last_name  = data.get('last_name',  '').strip()
        email      = data.get('email',      '').strip()
        password   = data.get('password',   '').strip()
        role       = data.get('role',       User.ROLE_EMPLOYEE)
        status_val = data.get('status',     User.STATUS_ACTIVE)
        location   = data.get('location',  '').strip()
        dept_id    = data.get('department')

        if not first_name: errors['first_name'] = 'First name is required.'
        if not email:       errors['email']      = 'Email is required.'
        if not password:    errors['password']   = 'Password is required.'

        if email and User.objects.filter(email=email).exists():
            errors['email'] = 'A user with this email already exists.'

        if password and not errors.get('password'):
            try:
                validate_password(password)
            except DjangoValidationError as e:
                errors['password'] = ' '.join(e.messages)

        if role not in {User.ROLE_ADMIN, User.ROLE_AGENT, User.ROLE_EMPLOYEE}:
            errors['role'] = 'Invalid role.'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique username from email
        base = email.split('@')[0].replace('.', '_').lower()
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{suffix}"
            suffix += 1

        dept = None
        if dept_id:
            try:
                dept = Department.objects.get(pk=dept_id, company=request.user.company)
            except Department.DoesNotExist:
                pass

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            company=request.user.company,
            role=role,
            status=status_val,
            location=location,
            department=dept,
        )
        return Response(_user_to_dict(user), status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsCompanyAdmin]

    def _get(self, pk, company):
        try:
            return (
                User.objects
                .filter(company=company)
                .select_related('department', 'reports_to')
                .get(pk=pk)
            )
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get(pk, request.user.company)
        if not user:
            return Response(status=status.HTTP_404_NOT_FOUND)

        data = _user_to_dict(user)
        assigned_assets = Asset.objects.filter(
            company=request.user.company, assigned_to=user
        ).select_related('department')
        data['assigned_assets'] = AssetSerializer(assigned_assets, many=True).data
        return Response(data)

    def patch(self, request, pk):
        user = self._get(pk, request.user.company)
        if not user:
            return Response(status=status.HTTP_404_NOT_FOUND)
        allowed = {'first_name', 'last_name', 'email', 'role', 'status', 'location', 'department', 'reports_to'}
        for field, value in request.data.items():
            if field in allowed:
                setattr(user, field, value)
        user.save()
        return Response(_user_to_dict(user))
