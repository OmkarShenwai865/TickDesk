from rest_framework.views import APIView
from rest_framework.response import Response

from .permissions import IsCompanyAdmin
from .serializers import RecentTicketSerializer, RecentAssetSerializer
from . import services


class DashboardStatsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        data = services.get_dashboard_stats(request.user.company)
        return Response(data)


class TicketStatusView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        data = services.get_ticket_status_distribution(request.user.company)
        return Response(data)


class AssetDistributionView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        data = services.get_asset_distribution(request.user.company)
        return Response(data)


class RecentTicketsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        tickets = services.get_recent_tickets(request.user.company)
        return Response(RecentTicketSerializer(tickets, many=True).data)


class RecentAssetsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        assets = services.get_recent_assets(request.user.company)
        return Response(RecentAssetSerializer(assets, many=True).data)


class DeptAssetDistributionView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        from assets.models import Asset
        from django.db.models import Count, F

        company = request.user.company
        # Group by the assigned user's department (falls back to asset's own department)
        rows = (
            Asset.objects
            .filter(company=company)
            .annotate(dept_name=F('assigned_to__department__name'))
            .values('dept_name')
            .annotate(total=Count('id'))
            .filter(dept_name__isnull=False)
            .order_by('-total')[:8]
        )
        # Also count assets that have a direct department FK but no assigned user
        rows2 = (
            Asset.objects
            .filter(company=company, assigned_to__isnull=True, department__isnull=False)
            .values(dept_name=F('department__name'))
            .annotate(total=Count('id'))
            .order_by('-total')[:8]
        )
        # Merge both result sets
        merged = {}
        for r in list(rows) + list(rows2):
            name = r['dept_name']
            merged[name] = merged.get(name, 0) + r['total']
        result = sorted([{'name': k, 'total': v} for k, v in merged.items()], key=lambda x: -x['total'])[:8]
        return Response(result)


class DeptTicketDistributionView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        from tickets.models import Ticket
        from accounts.models import Department
        from django.db.models import Count, Q

        company = request.user.company
        depts = (
            Department.objects
            .filter(company=company)
            .annotate(
                open=Count('tickets', filter=Q(tickets__status='open')),
                in_progress=Count('tickets', filter=Q(tickets__status='in_progress')),
                resolved=Count('tickets', filter=Q(tickets__status='resolved')),
                closed=Count('tickets', filter=Q(tickets__status='closed')),
                total=Count('tickets'),
            )
            .filter(total__gt=0)
            .order_by('-total')[:8]
        )
        return Response([
            {
                'name':        d.name,
                'open':        d.open,
                'in_progress': d.in_progress,
                'resolved':    d.resolved,
                'closed':      d.closed,
                'total':       d.total,
            }
            for d in depts
        ])
