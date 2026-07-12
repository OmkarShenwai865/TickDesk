from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone

from accounts.models import User
from assets.models import Asset
from tickets.models import Ticket
from dashboard.permissions import IsCompanyAdmin, IsAgentOrAdmin


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

AVATAR_COLORS = [
    '#2563eb', '#7c3aed', '#16a34a', '#ea580c',
    '#0891b2', '#be185d', '#b45309', '#4f46e5',
]

CATEGORY_LABELS = {
    'laptop': 'Laptops', 'desktop': 'Desktops', 'printer': 'Printers',
    'monitor': 'Monitors', 'networking': 'Networking', 'server': 'Servers', 'other': 'Other',
}

CATEGORY_COLORS = [
    '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa',
    '#93c5fd', '#7c3aed', '#a78bfa',
]


def _is_agent(request):
    return getattr(request.user, 'role', '') == 'agent'


class ReportsSummaryView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        tickets = Ticket.objects.filter(company=company)
        assets  = Asset.objects.filter(company=company)

        if _is_agent(request):
            tickets = tickets.filter(assigned_to=request.user)
            assets  = assets.filter(assigned_to=request.user)

        total_t  = tickets.count()
        resolved = tickets.filter(status__in=['resolved', 'closed']).count()
        sla_pct  = round(resolved / total_t * 100) if total_t else 0

        total_a  = assets.count()
        assigned = assets.filter(status='assigned').count()
        util_pct = round(assigned / total_a * 100) if total_a else 0

        users = User.objects.filter(company=company)
        active_users_qs = users.filter(status='active')

        now = timezone.now()
        cutoff_30 = now - timedelta(days=30)
        months = _last_6_month_starts(now)

        def _delta(filtered_qs, date_field):
            n = filtered_qs.filter(**{f'{date_field}__gte': cutoff_30}).count()
            return 'steady' if n == 0 else f'+{n} vs last month'

        sla_trend = []
        for i, m_start in enumerate(months):
            m_end = months[i + 1] if i + 1 < len(months) else now
            bucket = tickets.filter(created_at__gte=m_start, created_at__lt=m_end)
            b_total = bucket.count()
            b_resolved = bucket.filter(status__in=['resolved', 'closed']).count()
            sla_trend.append(round(b_resolved / b_total * 100) if b_total else 0)

        return Response({
            'total_tickets':     total_t,
            'assets_managed':    total_a,
            'active_users':      active_users_qs.count() if not _is_agent(request) else None,
            'sla_compliance':    sla_pct,
            'resolution_rate':   sla_pct,
            'asset_utilization': util_pct,
            'total_tickets_delta':  _delta(tickets, 'created_at'),
            'assets_managed_delta': _delta(assets, 'created_at'),
            'active_users_delta':   _delta(active_users_qs, 'date_joined') if not _is_agent(request) else None,
            'total_tickets_trend':  _per_month_trend(tickets, 'created_at', months, now),
            'assets_managed_trend': _per_month_trend(assets, 'created_at', months, now),
            'active_users_trend':   _per_month_trend(active_users_qs, 'date_joined', months, now) if not _is_agent(request) else None,
            'sla_compliance_trend': sla_trend,
        })


class TicketTrendsView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        today   = date.today()
        days    = [(today - timedelta(days=6 - i)) for i in range(7)]
        labels  = [d.strftime('%a').upper() for d in days]

        tickets = Ticket.objects.filter(company=company)
        if _is_agent(request):
            tickets = tickets.filter(assigned_to=request.user)

        created_map = {
            r['created_at__date']: r['count']
            for r in tickets
            .filter(created_at__date__gte=days[0])
            .values('created_at__date')
            .annotate(count=Count('id'))
        }
        resolved_map = {
            r['updated_at__date']: r['count']
            for r in tickets
            .filter(status__in=['resolved', 'closed'], updated_at__date__gte=days[0])
            .values('updated_at__date')
            .annotate(count=Count('id'))
        }

        return Response({
            'days':       labels,
            'volume':     [created_map.get(d, 0) for d in days],
            'resolution': [resolved_map.get(d, 0) for d in days],
        })


class TicketsByStatusView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        qs      = Ticket.objects.filter(company=company)
        if _is_agent(request):
            qs = qs.filter(assigned_to=request.user)
        total   = qs.count()

        conf = [
            ('open',        'Open',        '#2563eb'),
            ('in_progress', 'In Progress', '#1d4ed8'),
            ('resolved',    'Resolved',    '#60a5fa'),
            ('closed',      'Closed',      '#93c5fd'),
        ]
        items = [
            {
                'label': label,
                'count': qs.filter(status=key).count(),
                'pct':   round(qs.filter(status=key).count() / total * 100) if total else 0,
                'color': color,
            }
            for key, label, color in conf
        ]
        return Response({'total': total, 'items': [i for i in items if i['count'] > 0]})


class TicketsByDeptView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        base = Ticket.objects.filter(company=company)
        if _is_agent(request):
            base = base.filter(assigned_to=request.user)
        qs = (
            base
            .values('department__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:8]
        )
        max_count = max((r['count'] for r in qs), default=1)
        return Response([
            {
                'label': r['department__name'] or 'Unassigned',
                'count': r['count'],
                'pct':   round(r['count'] / max_count * 100),
            }
            for r in qs
        ])


class AssetsByCategoryView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        base = Asset.objects.filter(company=company)
        if _is_agent(request):
            base = base.filter(assigned_to=request.user)
        qs = (
            base
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        total = sum(r['count'] for r in qs)
        return Response([
            {
                'label': CATEGORY_LABELS.get(r['category'], r['category']),
                'count': r['count'],
                'pct':   round(r['count'] / total * 100) if total else 0,
                'color': CATEGORY_COLORS[i % len(CATEGORY_COLORS)],
            }
            for i, r in enumerate(qs)
        ])


class TopAgentsView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        qs = (
            Ticket.objects
            .filter(company=company, status__in=['resolved', 'closed'])
            .exclude(assigned_to=None)
            .values('assigned_to__id', 'assigned_to__first_name', 'assigned_to__last_name')
            .annotate(solved=Count('id'))
            .order_by('-solved')[:5]
        )
        max_solved = max((r['solved'] for r in qs), default=1)
        result = []
        for i, r in enumerate(qs):
            first = r['assigned_to__first_name'] or ''
            last  = r['assigned_to__last_name']  or ''
            name  = f"{first} {last}".strip() or f"User {r['assigned_to__id']}"
            parts = name.split()
            result.append({
                'name':     name,
                'solved':   r['solved'],
                'initials': ''.join(p[0] for p in parts[:2]).upper(),
                'color':    AVATAR_COLORS[i % len(AVATAR_COLORS)],
                'bar_pct':  round(r['solved'] / max_solved * 100),
            })
        return Response(result)


class SystemHealthView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def get(self, request):
        company = request.user.company
        tickets = Ticket.objects.filter(company=company)
        assets  = Asset.objects.filter(company=company)
        if _is_agent(request):
            tickets = tickets.filter(assigned_to=request.user)
            assets  = assets.filter(assigned_to=request.user)

        total_t  = tickets.count()
        resolved = tickets.filter(status__in=['resolved', 'closed']).count()
        res_rate = round(resolved / total_t * 100) if total_t else 0

        total_a  = assets.count()
        assigned = assets.filter(status='assigned').count()
        util_pct = round(assigned / total_a * 100) if total_a else 0

        return Response([
            {'label': 'Resolution Rate',   'value': res_rate, 'color': '#16a34a'},
            {'label': 'Asset Utilization', 'value': util_pct, 'color': '#2563eb'},
            {'label': 'SLA Uptime',        'value': 99.9,     'color': '#16a34a'},
        ])
