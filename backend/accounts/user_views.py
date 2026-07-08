from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from .models import User, Department, Company, UserInvitation
from dashboard.permissions import IsCompanyAdmin, IsCompanyMember
from assets.models import Asset
from assets.serializers import AssetSerializer

PAGE_SIZE = 10


class CompanyRegisterView(APIView):
    permission_classes = []  # public

    def post(self, request):
        data       = request.data
        errors     = {}

        company_name = data.get('company_name', '').strip()
        first_name   = data.get('first_name',   '').strip()
        last_name    = data.get('last_name',     '').strip()
        email        = data.get('email',         '').strip()
        password     = data.get('password',      '').strip()

        if not company_name: errors['company_name'] = 'Company name is required.'
        if not first_name:   errors['first_name']   = 'First name is required.'
        if not email:        errors['email']         = 'Email is required.'
        if not password:     errors['password']      = 'Password is required.'

        if email and User.objects.filter(email=email).exists():
            errors['email'] = 'An account with this email already exists.'

        if password and not errors.get('password'):
            try:
                validate_password(password)
            except DjangoValidationError as e:
                errors['password'] = ' '.join(e.messages)

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Create company
        company = Company.objects.create(name=company_name)

        # Generate unique username from email
        base = email.split('@')[0].replace('.', '_').lower()
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{suffix}"
            suffix += 1

        # Create admin user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            company=company,
            role=User.ROLE_ADMIN,
            status=User.STATUS_ACTIVE,
        )

        return Response({
            'message': 'Company registered successfully. You can now log in.',
            'company': company.name,
            'email':   user.email,
        }, status=status.HTTP_201_CREATED)

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


def _invite_to_dict(invite, request=None):
    invite_path = f"/accept-invite/{invite.token}"
    frontend_origin = request.headers.get('Origin') if request else ''
    invite_url = f"{frontend_origin or 'http://localhost:5173'}{invite_path}"
    return {
        'id': invite.id,
        'email': invite.email,
        'role': invite.role,
        'role_display': invite.get_role_display(),
        'department': invite.department.name if invite.department else None,
        'department_id': invite.department_id,
        'location': invite.location,
        'status': invite.status,
        'expires_at': invite.expires_at,
        'created_at': invite.created_at,
        'invite_url': invite_url,
    }


def _invite_row_to_dict(invite, request=None):
    accepted_user = invite.accepted_by
    last_login = accepted_user.last_login if accepted_user else None
    return {
        'id': invite.id,
        'email': invite.email,
        'role': invite.role,
        'role_display': invite.get_role_display(),
        'department': invite.department.name if invite.department else None,
        'location': invite.location,
        'status': invite.status,
        'status_display': invite.get_status_display(),
        'invited_by': (
            invite.invited_by.get_full_name() or invite.invited_by.username
            if invite.invited_by else None
        ),
        'invite_url': _invite_to_dict(invite, request).get('invite_url'),
        'created_at': invite.created_at,
        'expires_at': invite.expires_at,
        'accepted_at': invite.accepted_at,
        'accepted_user_id': accepted_user.id if accepted_user else None,
        'accepted_user_name': (
            accepted_user.get_full_name() or accepted_user.username
            if accepted_user else None
        ),
        'has_logged_in': bool(last_login),
        'last_login': last_login,
    }


def _normalize_invite_payload(data, company, seen_emails=None):
    errors = {}
    dept = None

    if not isinstance(data, dict):
        return None, {'non_field': 'Invite row must be an object.'}

    email = data.get('email', '').strip().lower()
    role = data.get('role', User.ROLE_EMPLOYEE)
    location = data.get('location', '').strip()
    dept_id = data.get('department')

    if not email:
        errors['email'] = 'Email is required.'
    elif seen_emails is not None and email in seen_emails:
        errors['email'] = 'Duplicate email in this batch.'

    if role not in {User.ROLE_ADMIN, User.ROLE_AGENT, User.ROLE_EMPLOYEE}:
        errors['role'] = 'Invalid role.'

    if email and User.objects.filter(email=email).exists():
        errors['email'] = 'A user with this email already exists.'

    if email and UserInvitation.objects.filter(
        company=company,
        email=email,
        status=UserInvitation.STATUS_PENDING,
        expires_at__gt=timezone.now(),
    ).exists():
        errors['email'] = 'A pending invite already exists for this email.'

    if dept_id:
        try:
            dept = Department.objects.get(pk=dept_id, company=company)
        except Department.DoesNotExist:
            errors['department'] = 'Invalid department.'

    if errors:
        return None, errors

    return {
        'email': email,
        'role': role,
        'location': location,
        'department': dept,
    }, None


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
    permission_classes = [IsCompanyMember]

    def get(self, request):
        company = request.user.company
        requester_role = getattr(request.user, 'role', 'employee')
        qs = (
            User.objects
            .filter(company=company)
            .select_related('department', 'reports_to')
            .order_by('first_name', 'last_name', 'username')
        )

        # Agents can only see admins (for ticket assignment)
        if requester_role == 'agent':
            qs = qs.filter(role='admin')
        elif requester_role == 'employee':
            qs = qs.none()

        role = request.query_params.get('role', '').strip()
        if role and requester_role == 'admin':
            qs = qs.filter(role=role)

        department = request.query_params.get('department', '').strip()
        if department:
            qs = qs.filter(department_id=department)

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)       |
                Q(username__icontains=search)    |
                Q(department__name__icontains=search)
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
        if getattr(request.user, 'role', '') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
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


class UserInviteView(APIView):
    permission_classes = [IsCompanyAdmin]

    def post(self, request):
        normalized, errors = _normalize_invite_payload(request.data, request.user.company)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        invite = UserInvitation.objects.create(
            company=request.user.company,
            email=normalized['email'],
            role=normalized['role'],
            department=normalized['department'],
            location=normalized['location'],
            invited_by=request.user,
        )
        return Response(_invite_to_dict(invite, request), status=status.HTTP_201_CREATED)


class UserBulkInviteView(APIView):
    permission_classes = [IsCompanyAdmin]

    def post(self, request):
        invites = request.data.get('invites')
        if not isinstance(invites, list) or not invites:
            return Response(
                {'invites': 'Provide a non-empty invites list.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(invites) > 200:
            return Response(
                {'invites': 'You can invite up to 200 users at a time.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        seen_emails = set()
        results = []
        created = 0

        for index, row in enumerate(invites):
            normalized, errors = _normalize_invite_payload(row, request.user.company, seen_emails)
            if errors:
                results.append({
                    'index': index,
                    'email': row.get('email', '').strip().lower() if isinstance(row, dict) else '',
                    'status': 'invalid',
                    'errors': errors,
                })
                continue

            invite = UserInvitation.objects.create(
                company=request.user.company,
                email=normalized['email'],
                role=normalized['role'],
                department=normalized['department'],
                location=normalized['location'],
                invited_by=request.user,
            )
            seen_emails.add(normalized['email'])
            created += 1
            results.append({
                'index': index,
                'email': invite.email,
                'status': 'created',
                'invite': _invite_to_dict(invite, request),
            })

        invalid = len(results) - created
        return Response({
            'summary': {
                'total': len(invites),
                'created': created,
                'invalid': invalid,
            },
            'results': results,
        }, status=status.HTTP_200_OK)


class UserInviteListView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = (
            UserInvitation.objects
            .filter(company=company)
            .select_related('department', 'invited_by', 'accepted_by')
            .order_by('-created_at')
        )

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(accepted_by__first_name__icontains=search) |
                Q(accepted_by__last_name__icontains=search) |
                Q(accepted_by__username__icontains=search)
            )

        status_filter = request.query_params.get('invite_status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        total = qs.count()
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(int(request.query_params.get('page_size', PAGE_SIZE)), 200)
        start = (page - 1) * page_size

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': [_invite_row_to_dict(invite, request) for invite in qs[start:start + page_size]],
        })


class UserInviteAcceptView(APIView):
    permission_classes = []

    def get(self, request, token):
        try:
            invite = UserInvitation.objects.select_related('department').get(
                token=token,
                status=UserInvitation.STATUS_PENDING,
            )
        except UserInvitation.DoesNotExist:
            return Response({'detail': 'Invitation is invalid or already used.'}, status=status.HTTP_400_BAD_REQUEST)

        if invite.is_expired:
            invite.status = UserInvitation.STATUS_EXPIRED
            invite.save(update_fields=['status'])
            return Response({'detail': 'Invitation has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(_invite_to_dict(invite, request))

    def post(self, request, token):
        try:
            invite = UserInvitation.objects.select_related('company', 'department').get(
                token=token,
                status=UserInvitation.STATUS_PENDING,
            )
        except UserInvitation.DoesNotExist:
            return Response({'detail': 'Invitation is invalid or already used.'}, status=status.HTTP_400_BAD_REQUEST)

        if invite.is_expired:
            invite.status = UserInvitation.STATUS_EXPIRED
            invite.save(update_fields=['status'])
            return Response({'detail': 'Invitation has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        errors = {}
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        password = data.get('password', '').strip()

        if not first_name:
            errors['first_name'] = 'First name is required.'
        if not password:
            errors['password'] = 'Password is required.'
        if User.objects.filter(email=invite.email).exists():
            errors['email'] = 'A user with this email already exists.'
        if password and not errors.get('password'):
            try:
                validate_password(password)
            except DjangoValidationError as e:
                errors['password'] = ' '.join(e.messages)

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        base = invite.email.split('@')[0].replace('.', '_').lower()
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{suffix}"
            suffix += 1

        user = User.objects.create_user(
            username=username,
            email=invite.email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            company=invite.company,
            role=invite.role,
            status=User.STATUS_ACTIVE,
            location=invite.location,
            department=invite.department,
        )
        invite.status = UserInvitation.STATUS_ACCEPTED
        invite.accepted_by = user
        invite.accepted_at = timezone.now()
        invite.save(update_fields=['status', 'accepted_by', 'accepted_at'])

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
            if field not in allowed:
                continue
            if field == 'department':
                if value is None:
                    user.department = None
                else:
                    try:
                        from .models import Department
                        user.department = Department.objects.get(pk=value, company=user.company)
                    except Department.DoesNotExist:
                        return Response({'department': 'Invalid department.'}, status=status.HTTP_400_BAD_REQUEST)
            elif field == 'reports_to':
                if value is None:
                    user.reports_to = None
                else:
                    try:
                        user.reports_to = User.objects.get(pk=value, company=user.company)
                    except User.DoesNotExist:
                        return Response({'reports_to': 'Invalid user.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                setattr(user, field, value)
        user.save()
        return Response(_user_to_dict(user))
