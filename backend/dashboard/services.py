from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from tickets.models import Ticket
from assets.models import Asset
from accounts.models import Department

# Human-readable labels for DB choice values
_STATUS_LABELS = {
    'open':        'Open',
    'in_progress': 'In Progress',
    'resolved':    'Resolved',
    'closed':      'Closed',
}

_CATEGORY_LABELS = {
    'laptop':     'Laptop',
    'desktop':    'Desktop',
    'printer':    'Printer',
    'monitor':    'Monitor',
    'networking': 'Networking',
    'server':     'Server',
    'other':      'Other',
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


def _cumulative_trend(qs, date_field, months, now):
    trend = []
    for i, m_start in enumerate(months):
        boundary = months[i + 1] if i + 1 < len(months) else now
        trend.append(qs.filter(**{f'{date_field}__lt': boundary}).count())
    return trend


def _per_month_trend(qs, date_field, months, now):
    trend = []
    for i, m_start in enumerate(months):
        m_end = months[i + 1] if i + 1 < len(months) else now
        trend.append(qs.filter(**{f'{date_field}__gte': m_start, f'{date_field}__lt': m_end}).count())
    return trend


def get_dashboard_stats(company):
    """Return aggregated stat counts, real deltas, and 6-month trends for the given company."""
    asset_qs  = Asset.objects.filter(company=company)
    ticket_qs = Ticket.objects.filter(company=company)
    users_qs  = company.users.all()
    depts_qs  = Department.objects.filter(company=company)

    now = timezone.now()
    cutoff_30 = now - timedelta(days=30)
    months = _last_6_month_starts(now)

    def _delta(n):
        return 'steady' if n == 0 else f'+{n} vs last month'

    new_assets = asset_qs.filter(created_at__gte=cutoff_30).count()
    new_users = users_qs.filter(date_joined__gte=cutoff_30).count()
    new_depts = depts_qs.filter(created_at__gte=cutoff_30).count()
    opened_30 = ticket_qs.filter(created_at__gte=cutoff_30).count()
    resolved_30 = ticket_qs.filter(status=Ticket.STATUS_RESOLVED, updated_at__gte=cutoff_30).count()
    ticket_net = opened_30 - resolved_30

    if ticket_net > 0:
        ticket_delta, ticket_up = f'+{ticket_net} vs last month', False
    elif ticket_net < 0:
        ticket_delta, ticket_up = f'{ticket_net} vs last month', True
    else:
        ticket_delta, ticket_up = 'steady', True

    return {
        'total_assets':      asset_qs.count(),
        'active_assets':     asset_qs.filter(status=Asset.STATUS_ASSIGNED).count(),
        'total_tickets':     ticket_qs.count(),
        'open_tickets':      ticket_qs.filter(status=Ticket.STATUS_OPEN).count(),
        'resolved_tickets':  ticket_qs.filter(status=Ticket.STATUS_RESOLVED).count(),
        'total_users':       users_qs.count(),
        'total_departments': depts_qs.count(),
        'total_assets_delta':      _delta(new_assets),
        'total_users_delta':       _delta(new_users),
        'total_departments_delta': _delta(new_depts),
        'open_tickets_delta':      ticket_delta,
        'open_tickets_up':         ticket_up,
        'total_assets_trend':      _cumulative_trend(asset_qs, 'created_at', months, now),
        'total_users_trend':       _cumulative_trend(users_qs, 'date_joined', months, now),
        'total_departments_trend': _cumulative_trend(depts_qs, 'created_at', months, now),
        'open_tickets_trend':      _per_month_trend(ticket_qs, 'created_at', months, now),
    }


def get_ticket_status_distribution(company):
    """Return ticket counts grouped by status, with human-readable labels."""
    qs = (
        Ticket.objects
        .filter(company=company)
        .values('status')
        .annotate(count=Count('id'))
        .order_by('status')
    )
    return [
        {'status': _STATUS_LABELS.get(row['status'], row['status']), 'count': row['count']}
        for row in qs
    ]


def get_asset_distribution(company):
    """Return asset counts grouped by category, with human-readable labels."""
    qs = (
        Asset.objects
        .filter(company=company)
        .values('category')
        .annotate(count=Count('id'))
        .order_by('category')
    )
    return [
        {'category': _CATEGORY_LABELS.get(row['category'], row['category']), 'count': row['count']}
        for row in qs
    ]


def get_recent_tickets(company, limit=5):
    """Return the most recent tickets with related user data in one query."""
    return (
        Ticket.objects
        .filter(company=company)
        .select_related('created_by', 'assigned_to')
        .order_by('-created_at')[:limit]
    )


def get_recent_assets(company, limit=5):
    """Return the most recently added assets with related user data in one query."""
    return (
        Asset.objects
        .filter(company=company)
        .select_related('assigned_to')
        .order_by('-created_at')[:limit]
    )
