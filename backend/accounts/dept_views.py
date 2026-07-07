from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q

from .models import Department, User
from .serializers import DepartmentListSerializer, DepartmentDetailSerializer
from dashboard.permissions import IsCompanyAdmin
from tickets.models import Ticket

PAGE_SIZE = 10


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
        return Response({
            'total_departments':  Department.objects.filter(company=company).count(),
            'total_employees':    User.objects.filter(company=company).count(),
            'active_departments': Department.objects.filter(company=company).count(),
            'open_tickets':       Ticket.objects.filter(company=company, status=Ticket.STATUS_OPEN).count(),
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
    permission_classes = [IsCompanyAdmin]

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
