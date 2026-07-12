from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import Department, User
from .serializers import DepartmentListSerializer, DepartmentDetailSerializer
from dashboard.permissions import IsCompanyAdmin, IsCompanyMember
from tickets.models import Ticket

PAGE_SIZE = 10


def _last_6_month_starts(now):
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    months = []
    cursor = month_start
    for _ in range(6):
        months.append(cursor)
        if cursor.month == 1:
            cursor = cursor.replace(year=cursor.year - 1, month=12)
        else:
            cursor = cursor.replace(month=cursor.month - 1)
    months.reverse()
    return months


def _per_month_trend(qs, date_field, months, now):
    trend = []
    for i, m_start in enumerate(months):
        m_end = months[i + 1] if i + 1 < len(months) else now
        trend.append(qs.filter(**{f'{date_field}__gte': m_start, f'{date_field}__lt': m_end}).count())
    return trend


def _dept_qs(company):
    return (
        Department.objects
        .filter(company=company)
        .select_related('head')
        .annotate(
            employees_count    = Count('users',   distinct=True),
            assets_count       = Count('assets',  distinct=True),
            open_tickets_count = Count('tickets', filter=Q(tickets__status='open'), distinct=True),
        )
    )


class DepartmentStatsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        now = timezone.now()
        cutoff_30 = now - timedelta(days=30)
        months = _last_6_month_starts(now)

        def _delta(filtered_qs, date_field):
            n = filtered_qs.filter(**{f'{date_field}__gte': cutoff_30}).count()
            return 'steady' if n == 0 else f'+{n} vs last month'

        depts_qs    = Department.objects.filter(company=company)
        users_qs    = User.objects.filter(company=company)
        open_tix_qs = Ticket.objects.filter(company=company, status=Ticket.STATUS_OPEN)

        return Response({
            'total_departments':  depts_qs.count(),
            'total_employees':    users_qs.count(),
            'active_departments': depts_qs.count(),
            'open_tickets':       open_tix_qs.count(),
            'total_departments_delta':  _delta(depts_qs, 'created_at'),
            'total_employees_delta':    _delta(users_qs, 'date_joined'),
            'active_departments_delta': _delta(depts_qs, 'created_at'),
            'open_tickets_delta':       _delta(open_tix_qs, 'created_at'),
            'total_departments_trend':  _per_month_trend(depts_qs, 'created_at', months, now),
            'total_employees_trend':    _per_month_trend(users_qs, 'date_joined', months, now),
            'active_departments_trend': _per_month_trend(depts_qs, 'created_at', months, now),
            'open_tickets_trend':       _per_month_trend(open_tix_qs, 'created_at', months, now),
        })


class DepartmentEmployeeDistView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = (
            Department.objects
            .filter(company=company)
            .annotate(count=Count('users'))
            .values('name', 'count')
            .order_by('-count')[:5]
        )
        total = User.objects.filter(company=company).count()
        return Response([
            {
                'label': r['name'],
                'count': r['count'],
                'pct':   round(r['count'] / total * 100) if total else 0,
            }
            for r in qs
        ])


class DepartmentTicketLoadView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = Ticket.objects.filter(company=company, status=Ticket.STATUS_OPEN)
        total    = qs.count()
        critical = qs.filter(priority__in=['high', 'critical']).count()
        general  = total - critical
        return Response({
            'total':    total,
            'general':  general,
            'critical': critical,
            'general_pct':  round(general  / total * 100) if total else 0,
            'critical_pct': round(critical / total * 100) if total else 0,
        })


class DepartmentTopPerformingView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        company = request.user.company
        qs = (
            Department.objects
            .filter(company=company)
            .select_related('head')
            .annotate(
                employees_count    = Count('users', distinct=True),
                open_tickets_count = Count('tickets', filter=Q(tickets__status='open'), distinct=True),
            )
            .order_by('open_tickets_count', '-employees_count')[:3]
        )
        colors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2']
        result = []
        for i, d in enumerate(qs):
            head_name = None
            if d.head:
                head_name = d.head.get_full_name() or d.head.username
            initials = "".join(p[0] for p in d.name.split()[:2]).upper()
            result.append({
                'id':       d.id,
                'name':     d.name,
                'initials': initials,
                'head':     head_name,
                'color':    colors[i % len(colors)],
            })
        return Response(result)


class DepartmentListCreateView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        qs     = _dept_qs(request.user.company).order_by('name')
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(name__icontains=search)

        total     = qs.count()
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(int(request.query_params.get('page_size', PAGE_SIZE)), 200)
        start     = (page - 1) * page_size

        return Response({
            'count':     total,
            'page':      page,
            'page_size': page_size,
            'results':   DepartmentListSerializer(qs[start:start + page_size], many=True).data,
        })

    def post(self, request):
        if getattr(request.user, 'role', '') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = DepartmentListSerializer(data=request.data)
        if serializer.is_valid():
            dept = serializer.save(company=request.user.company)
            # Re-fetch with annotations so read-only count fields serialize correctly
            dept_annotated = _dept_qs(request.user.company).get(pk=dept.pk)
            return Response(DepartmentListSerializer(dept_annotated).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartmentDetailView(APIView):
    permission_classes = [IsCompanyAdmin]

    def _get(self, pk, company):
        try:
            return _dept_qs(company).get(pk=pk)
        except Department.DoesNotExist:
            return None

    def get(self, request, pk):
        dept = self._get(pk, request.user.company)
        if not dept:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(DepartmentDetailSerializer(dept).data)

    def patch(self, request, pk):
        dept = self._get(pk, request.user.company)
        if not dept:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentListSerializer(dept, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        dept = self._get(pk, request.user.company)
        if not dept:
            return Response(status=status.HTTP_404_NOT_FOUND)
        dept.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
