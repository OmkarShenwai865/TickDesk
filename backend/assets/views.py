from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count

from .models import Asset
from .serializers import AssetSerializer
from dashboard.permissions import IsCompanyAdmin

PAGE_SIZE = 10

_CATEGORY_LABELS = {
    'laptop': 'Laptops', 'desktop': 'Desktops', 'printer': 'Printers',
    'monitor': 'Monitors', 'networking': 'Networking', 'server': 'Servers', 'other': 'Other',
}
_CATEGORY_COLORS = {
    'laptop': '#2563eb', 'desktop': '#16a34a', 'monitor': '#9ca3af',
    'printer': '#d1d5db', 'networking': '#06b6d4', 'server': '#ef4444', 'other': '#6b7280',
}


class AssetStatsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        qs = Asset.objects.filter(company=request.user.company)
        return Response({
            'total':       qs.count(),
            'assigned':    qs.filter(status=Asset.STATUS_ASSIGNED).count(),
            'available':   qs.filter(status=Asset.STATUS_AVAILABLE).count(),
            'maintenance': qs.filter(status=Asset.STATUS_MAINTENANCE).count(),
        })


class AssetDistributionView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        qs = (
            Asset.objects
            .filter(company=request.user.company)
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        total = Asset.objects.filter(company=request.user.company).count()
        return Response([
            {
                'label': _CATEGORY_LABELS.get(row['category'], row['category']),
                'count': row['count'],
                'pct':   round(row['count'] / total * 100, 1) if total else 0,
                'color': _CATEGORY_COLORS.get(row['category'], '#6b7280'),
            }
            for row in qs
        ])


class AssetListCreateView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        qs = (
            Asset.objects
            .filter(company=request.user.company)
            .select_related('assigned_to', 'department')
            .order_by('-created_at')
        )

        category      = request.query_params.get('category')
        status_filter = request.query_params.get('status')
        if category:
            qs = qs.filter(category=category)
        if status_filter:
            qs = qs.filter(status=status_filter)

        total = qs.count()
        page  = max(1, int(request.query_params.get('page', 1)))
        start = (page - 1) * PAGE_SIZE

        return Response({
            'count':     total,
            'page':      page,
            'page_size': PAGE_SIZE,
            'results':   AssetSerializer(qs[start:start + PAGE_SIZE], many=True).data,
        })

    def post(self, request):
        serializer = AssetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(company=request.user.company)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssetDetailView(APIView):
    permission_classes = [IsCompanyAdmin]

    def _get(self, pk, company):
        try:
            return Asset.objects.get(pk=pk, company=company)
        except Asset.DoesNotExist:
            return None

    def get(self, request, pk):
        asset = self._get(pk, request.user.company)
        if not asset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(AssetSerializer(asset).data)

    def patch(self, request, pk):
        asset = self._get(pk, request.user.company)
        if not asset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = AssetSerializer(asset, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        asset = self._get(pk, request.user.company)
        if not asset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        asset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
