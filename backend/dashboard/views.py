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
