from django.db.models import Count
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


def get_dashboard_stats(company):
    """Return aggregated stat counts for the given company."""
    asset_qs  = Asset.objects.filter(company=company)
    ticket_qs = Ticket.objects.filter(company=company)

    return {
        'total_assets':      asset_qs.count(),
        'active_assets':     asset_qs.filter(status=Asset.STATUS_ASSIGNED).count(),
        'total_tickets':     ticket_qs.count(),
        'open_tickets':      ticket_qs.filter(status=Ticket.STATUS_OPEN).count(),
        'resolved_tickets':  ticket_qs.filter(status=Ticket.STATUS_RESOLVED).count(),
        'total_users':       company.users.count(),
        'total_departments': Department.objects.filter(company=company).count(),
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
