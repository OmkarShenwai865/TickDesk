from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .models import Asset, AssetActivity
from .serializers import AssetSerializer
from dashboard.permissions import IsCompanyAdmin, IsCompanyMember

PAGE_SIZE = 10

_CATEGORY_LABELS = {
    'laptop': 'Laptops', 'desktop': 'Desktops', 'printer': 'Printers',
    'monitor': 'Monitors', 'networking': 'Networking', 'server': 'Servers', 'other': 'Other',
}
_CATEGORY_COLORS = {
    'laptop': '#2563eb', 'desktop': '#16a34a', 'monitor': '#9ca3af',
    'printer': '#d1d5db', 'networking': '#06b6d4', 'server': '#ef4444', 'other': '#6b7280',
}


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


def _per_month_trend(qs, months, now):
    trend = []
    for i, m_start in enumerate(months):
        m_end = months[i + 1] if i + 1 < len(months) else now
        trend.append(qs.filter(created_at__gte=m_start, created_at__lt=m_end).count())
    return trend


class AssetStatsView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        qs = Asset.objects.filter(company=request.user.company)
        now = timezone.now()
        cutoff_30 = now - timedelta(days=30)
        months = _last_6_month_starts(now)

        def _delta(filtered_qs):
            n = filtered_qs.filter(created_at__gte=cutoff_30).count()
            return 'steady' if n == 0 else f'+{n} vs last month'

        total_qs       = qs
        assigned_qs    = qs.filter(status=Asset.STATUS_ASSIGNED)
        available_qs   = qs.filter(status=Asset.STATUS_AVAILABLE)
        maintenance_qs = qs.filter(status=Asset.STATUS_MAINTENANCE)

        return Response({
            'total':       total_qs.count(),
            'assigned':    assigned_qs.count(),
            'available':   available_qs.count(),
            'maintenance': maintenance_qs.count(),
            'total_delta':       _delta(total_qs),
            'assigned_delta':    _delta(assigned_qs),
            'available_delta':   _delta(available_qs),
            'maintenance_delta': _delta(maintenance_qs),
            'total_trend':       _per_month_trend(total_qs, months, now),
            'assigned_trend':    _per_month_trend(assigned_qs, months, now),
            'available_trend':   _per_month_trend(available_qs, months, now),
            'maintenance_trend': _per_month_trend(maintenance_qs, months, now),
        })


class AssetDistributionView(APIView):
    permission_classes = [IsCompanyMember]

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
    permission_classes = [IsCompanyMember]

    def get(self, request):
        qs = (
            Asset.objects
            .filter(company=request.user.company)
            .select_related('assigned_to', 'department')
            .order_by('-created_at')
        )

        category      = request.query_params.get('category')
        department    = request.query_params.get('department')
        status_filter = request.query_params.get('status')
        my_assets     = request.query_params.get('my_assets')
        if category:
            qs = qs.filter(category=category)
        if department:
            qs = qs.filter(department_id=department)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if my_assets == '1':
            qs = qs.filter(assigned_to=request.user)

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
        if getattr(request.user, 'role', '') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AssetSerializer(data=request.data)
        if serializer.is_valid():
            asset = serializer.save(company=request.user.company)
            AssetActivity.objects.create(
                asset=asset, actor=request.user,
                action=f"Asset \"{asset.asset_name} ({asset.asset_tag})\" was added to inventory",
            )
            if asset.assigned_to:
                AssetActivity.objects.create(
                    asset=asset, actor=request.user,
                    action=f"\"{asset.asset_name} ({asset.asset_tag})\" was assigned to {asset.assigned_to.get_full_name() or asset.assigned_to.username}",
                )
                from notifications.utils import notify
                notify(
                    asset.assigned_to,
                    'asset_assigned',
                    f"Asset assigned to you: {asset.asset_name}",
                    f"{asset.asset_tag} — {asset.get_category_display() if hasattr(asset, 'get_category_display') else asset.category}",
                    f"/assets/{asset.id}",
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssetDetailView(APIView):
    permission_classes = [IsCompanyMember]

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
        if getattr(request.user, 'role', '') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        asset = self._get(pk, request.user.company)
        if not asset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        old_assigned = asset.assigned_to_id
        old_status   = asset.status
        serializer = AssetSerializer(asset, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            # Log assignment change
            if 'assigned_to' in request.data and updated.assigned_to_id != old_assigned:
                if updated.assigned_to:
                    msg = f"\"{updated.asset_name} ({updated.asset_tag})\" was assigned to {updated.assigned_to.get_full_name() or updated.assigned_to.username}"
                    from notifications.utils import notify
                    notify(
                        updated.assigned_to,
                        'asset_assigned',
                        f"Asset assigned to you: {updated.asset_name}",
                        f"{updated.asset_tag}",
                        f"/assets/{updated.id}",
                    )
                else:
                    msg = f"\"{updated.asset_name} ({updated.asset_tag})\" was unassigned"
                AssetActivity.objects.create(asset=updated, actor=request.user, action=msg)
            # Log status change
            elif 'status' in request.data and updated.status != old_status:
                AssetActivity.objects.create(
                    asset=updated, actor=request.user,
                    action=f"\"{updated.asset_name} ({updated.asset_tag})\" status changed to {updated.get_status_display()}",
                )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if getattr(request.user, 'role', '') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        asset = self._get(pk, request.user.company)
        if not asset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        asset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetActivityView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        qs = (
            AssetActivity.objects
            .filter(asset__company=request.user.company)
            .select_related('asset', 'actor')
            .order_by('-created_at')[:20]
        )
        from django.utils.timesince import timesince
        result = []
        for a in qs:
            actor_name = ""
            if a.actor:
                actor_name = a.actor.get_full_name() or a.actor.username
            result.append({
                'id':         a.id,
                'action':     a.action,
                'actor':      actor_name,
                'asset_tag':  a.asset.asset_tag,
                'time':       timesince(a.created_at) + " ago",
            })
        return Response(result)
