import secrets

from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.models import Company, User, Department
from accounts.serializers import CompanySerializer
from accounts.email_utils import send_branded_email, paragraph, code_box
from assets.models import Asset, AssetActivity
from tickets.models import Ticket, TicketActivity

from .permissions import IsSuperAdmin

STATUS_COLORS = {
    'active': '#16a34a', 'busy': '#ea580c', 'inactive': '#9ca3af',
}


def _primary_admin(company):
    return User.objects.filter(company=company, role=User.ROLE_ADMIN).order_by('id').first()


def _company_row(company):
    admin = _primary_admin(company)
    return {
        'id': company.id,
        'name': company.name,
        'admin': (admin.get_full_name() or admin.username) if admin else '—',
        'email': admin.email if admin else '',
        'users': company.users.exclude(role=User.ROLE_SUPERADMIN).count(),
        'tickets': Ticket.objects.filter(company=company).count(),
        'registered': company.created_at.strftime('%b %d, %Y'),
        'active': company.is_active,
    }


class PlatformCompanyListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        companies = Company.objects.all().order_by('-created_at')
        return Response([_company_row(c) for c in companies])


class PlatformCompanyDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
        except Company.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        admin = _primary_admin(company)
        now = timezone.now()
        cutoff_30 = now - timedelta(days=30)

        users_qs = company.users.exclude(role=User.ROLE_SUPERADMIN).select_related('department')
        depts_qs = Department.objects.filter(company=company)
        assets_qs = Asset.objects.filter(company=company).select_related('assigned_to', 'department')
        tickets_qs = Ticket.objects.filter(company=company).select_related('created_by', 'assigned_to', 'department')

        total_users = users_qs.count()
        support_agents = users_qs.filter(role=User.ROLE_AGENT).count()
        open_tickets = tickets_qs.filter(status__in=[Ticket.STATUS_OPEN, Ticket.STATUS_IN_PROGRESS]).count()
        total_assets = assets_qs.count()

        new_users_30 = users_qs.filter(date_joined__gte=cutoff_30).count()
        new_agents_30 = users_qs.filter(role=User.ROLE_AGENT, date_joined__gte=cutoff_30).count()
        new_assets_30 = assets_qs.filter(created_at__gte=cutoff_30).count()
        opened_30 = tickets_qs.filter(created_at__gte=cutoff_30).count()
        resolved_30 = tickets_qs.filter(status=Ticket.STATUS_RESOLVED, updated_at__gte=cutoff_30).count()
        ticket_net = opened_30 - resolved_30

        def _delta(n):
            return 'steady' if n == 0 else f'+{n} vs last month'

        if ticket_net > 0:
            ticket_delta, ticket_up = f'+{ticket_net} vs last month', False
        elif ticket_net < 0:
            ticket_delta, ticket_up = f'{ticket_net} vs last month', True
        else:
            ticket_delta, ticket_up = 'steady', True

        resolved_count = tickets_qs.filter(status=Ticket.STATUS_RESOLVED).count()
        closed_count = tickets_qs.filter(status=Ticket.STATUS_CLOSED).count()
        ticket_status = {
            'Open': tickets_qs.filter(status=Ticket.STATUS_OPEN).count(),
            'In Progress': tickets_qs.filter(status=Ticket.STATUS_IN_PROGRESS).count(),
            'Resolved': resolved_count,
            'Closed': closed_count,
        }

        # Ticket creation trend — last 10 rolling 7-day windows, oldest first.
        ticket_creation = []
        for i in range(9, -1, -1):
            window_end = now - timedelta(days=7 * i)
            window_start = window_end - timedelta(days=7)
            ticket_creation.append(
                tickets_qs.filter(created_at__gte=window_start, created_at__lt=window_end).count()
            )

        users = [
            {
                'name': u.get_full_name() or u.username,
                'email': u.email,
                'role': u.get_role_display(),
                'status': u.get_status_display(),
                'status_color': STATUS_COLORS.get(u.status, '#9ca3af'),
                'department': u.department.name if u.department else None,
            }
            for u in users_qs.order_by('first_name', 'last_name')
        ]

        departments = [
            {
                'name': d.name,
                'users': d.users.count(),
                'assets': d.assets.count(),
            }
            for d in depts_qs
        ]

        assets = [
            {
                'name': a.asset_name,
                'category': a.get_category_display(),
                'assignedTo': (a.assigned_to.get_full_name() or a.assigned_to.username) if a.assigned_to else '—',
                'department': a.department.name if a.department else None,
                'status': a.get_status_display(),
                'purchaseDate': a.purchase_date.strftime('%b %d, %Y') if a.purchase_date else '—',
            }
            for a in assets_qs
        ]

        tickets = [
            {
                'id': t.ticket_number,
                'title': t.title,
                'status': t.get_status_display(),
                'priority': t.get_priority_display(),
                'department': t.department.name if t.department else None,
                'requester': (t.created_by.get_full_name() or t.created_by.username) if t.created_by else '—',
                'assignedTo': (t.assigned_to.get_full_name() or t.assigned_to.username) if t.assigned_to else '—',
                'created': t.created_at.strftime('%b %d, %Y'),
            }
            for t in tickets_qs
        ]

        # Recent activity — merge the two real audit-log tables, newest first.
        asset_acts = AssetActivity.objects.filter(asset__company=company).select_related('asset').order_by('-created_at')[:5]
        ticket_acts = TicketActivity.objects.filter(ticket__company=company).select_related('ticket').order_by('-created_at')[:5]
        activity_items = [
            {'text': a.action, 'meta': a.asset.asset_name, 'dot': '#2563eb', 'at': a.created_at}
            for a in asset_acts
        ] + [
            {'text': t.action, 'meta': t.ticket.ticket_number, 'dot': '#22c55e', 'at': t.created_at}
            for t in ticket_acts
        ]
        activity_items.sort(key=lambda x: x['at'], reverse=True)
        activity = [{'text': i['text'], 'meta': i['meta'], 'dot': i['dot']} for i in activity_items[:5]]

        return Response({
            'id': company.id,
            'name': company.name,
            'admin': (admin.get_full_name() or admin.username) if admin else '—',
            'email': admin.email if admin else '',
            'supportEmail': company.support_email,
            'website': company.website,
            'timezone': company.timezone,
            'registered': company.created_at.strftime('%b %d, %Y'),
            'active': company.is_active,
            'totalUsers': total_users,
            'supportAgents': support_agents,
            'openTickets': open_tickets,
            'totalAssets': total_assets,
            'usersDelta': _delta(new_users_30),
            'agentsDelta': _delta(new_agents_30),
            'assetsDelta': _delta(new_assets_30),
            'ticketDelta': ticket_delta,
            'ticketUp': ticket_up,
            'ticketCreation': ticket_creation,
            'ticketStatus': ticket_status,
            'users': users,
            'departments': departments,
            'assets': assets,
            'tickets': tickets,
            'activity': activity,
        })

    def patch(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
        except Company.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if 'active' in request.data:
            company.is_active = bool(request.data['active'])
            company.save(update_fields=['is_active'])

        serializer = CompanySerializer(company, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response({
            **_company_row(company),
            'supportEmail': company.support_email,
            'website': company.website,
            'timezone': company.timezone,
        })


class PlatformCompanyResetPasswordView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
        except Company.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        admin = _primary_admin(company)
        if not admin:
            return Response({'detail': 'This company has no admin to reset.'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = secrets.token_urlsafe(9)
        admin.set_password(new_password)
        admin.save(update_fields=['password'])

        body_html = (
            paragraph(f"Hi {admin.first_name or admin.username},")
            + paragraph(f"Your TickDesk admin password for {company.name} was reset by the platform team. Your new temporary password is:")
            + code_box(new_password)
            + paragraph("Please log in and change it as soon as possible.", color="#9ca3af")
        )
        text = (
            f"Hi {admin.first_name or admin.username},\n\n"
            f"Your TickDesk admin password for {company.name} was reset by the platform team.\n\n"
            f"New temporary password: {new_password}\n\n"
            f"Please log in and change it as soon as possible."
        )
        send_branded_email(
            to=[admin.email],
            subject="Your TickDesk admin password has been reset",
            preheader="PASSWORD RESET",
            title="Your password has been reset",
            body_html=body_html,
            text_fallback=text,
        )

        return Response({'detail': f'Password reset email sent to {admin.email}.'})


class PlatformDashboardStatsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        cutoff_30 = now - timedelta(days=30)

        companies_qs = Company.objects.all()
        users_qs = User.objects.exclude(role=User.ROLE_SUPERADMIN)
        depts_qs = Department.objects.all()
        tickets_qs = Ticket.objects.all()

        def _delta(n):
            return 'steady' if n == 0 else f'+{n} vs last month'

        new_companies = companies_qs.filter(created_at__gte=cutoff_30).count()
        new_users = users_qs.filter(date_joined__gte=cutoff_30).count()
        new_agents = users_qs.filter(role=User.ROLE_AGENT, date_joined__gte=cutoff_30).count()
        new_depts = depts_qs.filter(created_at__gte=cutoff_30).count()
        new_tickets = tickets_qs.filter(created_at__gte=cutoff_30).count()

        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_companies_this_month = companies_qs.filter(created_at__gte=month_start).count()
        prev_month_end = month_start - timedelta(seconds=1)
        prev_month_start = prev_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_companies_prev_month = companies_qs.filter(
            created_at__gte=prev_month_start, created_at__lte=prev_month_end
        ).count()
        month_delta = new_companies_this_month - new_companies_prev_month

        # Last 6 calendar month boundaries (oldest first), used for both the
        # cumulative stat-tile trends and the per-month "Company Growth" chart.
        months = []
        cursor = month_start
        for _ in range(6):
            months.append(cursor)
            if cursor.month == 1:
                cursor = cursor.replace(year=cursor.year - 1, month=12)
            else:
                cursor = cursor.replace(month=cursor.month - 1)
        months.reverse()

        def _cumulative_trend(qs, date_field):
            trend = []
            for i, m_start in enumerate(months):
                boundary = months[i + 1] if i + 1 < len(months) else now
                trend.append(qs.filter(**{f'{date_field}__lt': boundary}).count())
            return trend

        growth, growth_months = [], []
        for i, m_start in enumerate(months):
            m_end = months[i + 1] if i + 1 < len(months) else now
            count = companies_qs.filter(created_at__gte=m_start, created_at__lt=m_end).count() \
                if i + 1 < len(months) else companies_qs.filter(created_at__gte=m_start).count()
            growth.append(count)
            growth_months.append(m_start.strftime('%b'))

        summary = {
            'totalCompanies': companies_qs.count(),
            'totalUsers': users_qs.count(),
            'supportAgents': users_qs.filter(role=User.ROLE_AGENT).count(),
            'departments': depts_qs.count(),
            'totalTickets': tickets_qs.count(),
            'newThisMonth': new_companies_this_month,
            'companiesDelta': _delta(new_companies),
            'usersDelta': _delta(new_users),
            'agentsDelta': _delta(new_agents),
            'deptsDelta': _delta(new_depts),
            'ticketsDelta': _delta(new_tickets),
            'monthDelta': (f'+{month_delta} vs last month' if month_delta >= 0 else f'{month_delta} vs last month'),
            'monthUp': month_delta >= 0,
            'companiesTrend': _cumulative_trend(companies_qs, 'created_at'),
            'usersTrend': _cumulative_trend(users_qs, 'date_joined'),
            'agentsTrend': _cumulative_trend(users_qs.filter(role=User.ROLE_AGENT), 'date_joined'),
            'deptsTrend': _cumulative_trend(depts_qs, 'created_at'),
            'ticketsTrend': _cumulative_trend(tickets_qs, 'created_at'),
            'monthTrend': growth,
        }

        recent = [
            {'name': c.name, 'registered': c.created_at.strftime('%b %d, %Y'), 'active': c.is_active}
            for c in companies_qs.order_by('-created_at')[:3]
        ]

        size_bands = {'1-5 users': 0, '6-15 users': 0, '16+ users': 0}
        for c in companies_qs:
            n = c.users.exclude(role=User.ROLE_SUPERADMIN).count()
            if n <= 5:
                size_bands['1-5 users'] += 1
            elif n <= 15:
                size_bands['6-15 users'] += 1
            else:
                size_bands['16+ users'] += 1

        return Response({
            'summary': summary,
            'growth': growth,
            'growthMonths': growth_months,
            'recentRegistrations': recent,
            'sizeBands': [{'label': k, 'count': v} for k, v in size_bands.items()],
        })


class PlatformAnnouncementView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response([
            {'id': c.id, 'name': c.name, 'admin': (a.get_full_name() or a.username) if (a := _primary_admin(c)) else '—'}
            for c in Company.objects.all().order_by('name')
        ])

    def post(self, request):
        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()
        company_id = request.data.get('company_id')

        if not subject or not message:
            return Response({'detail': 'Subject and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if company_id:
            try:
                company = Company.objects.get(pk=company_id)
            except Company.DoesNotExist:
                return Response({'detail': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)
            admins = User.objects.filter(company=company, role=User.ROLE_ADMIN)
        else:
            admins = User.objects.filter(role=User.ROLE_ADMIN)

        recipients = [a.email for a in admins if a.email]
        if recipients:
            send_branded_email(
                to=recipients,
                subject=subject,
                preheader="ANNOUNCEMENT FROM TICKDESK",
                title=subject,
                body_html=paragraph(message),
                text_fallback=message,
            )

        return Response({'detail': f'Sent to {len(recipients)} admin{"" if len(recipients) == 1 else "s"}.', 'count': len(recipients)})


class PlatformReportCompaniesView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        rows = []
        for c in Company.objects.all().order_by('-created_at'):
            admin = _primary_admin(c)
            rows.append({
                'Company ID': c.id,
                'Company Name': c.name,
                'Admin Name': (admin.get_full_name() or admin.username) if admin else '—',
                'Admin Email': admin.email if admin else '—',
                'Total Employees': c.users.exclude(role=User.ROLE_SUPERADMIN).count(),
                'Departments': Department.objects.filter(company=c).count(),
                'Open Tickets': Ticket.objects.filter(company=c, status__in=['open', 'in_progress']).count(),
                'Closed Tickets': Ticket.objects.filter(company=c, status__in=['resolved', 'closed']).count(),
                'Assets': Asset.objects.filter(company=c).count(),
                'Status': 'Active' if c.is_active else 'Suspended',
                'Created On': c.created_at.strftime('%b %d, %Y'),
            })
        return Response(rows)


class PlatformReportUsersView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        rows = []
        for u in User.objects.exclude(role=User.ROLE_SUPERADMIN).select_related('company', 'department').order_by('company__name', 'first_name'):
            rows.append({
                'Name': u.get_full_name() or u.username,
                'Email': u.email,
                'Role': u.get_role_display(),
                'Company': u.company.name if u.company else '—',
                'Department': u.department.name if u.department else '—',
                'Status': u.get_status_display(),
                'Created On': u.date_joined.strftime('%b %d, %Y'),
            })
        return Response(rows)


class PlatformReportTicketsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        rows = []
        for t in Ticket.objects.select_related('company', 'department', 'created_by', 'assigned_to').order_by('-created_at'):
            rows.append({
                'Ticket': t.ticket_number,
                'Title': t.title,
                'Company': t.company.name,
                'Department': t.department.name if t.department else '—',
                'Requester': (t.created_by.get_full_name() or t.created_by.username) if t.created_by else '—',
                'Assigned To': (t.assigned_to.get_full_name() or t.assigned_to.username) if t.assigned_to else '—',
                'Priority': t.get_priority_display(),
                'Status': t.get_status_display(),
                'Created': t.created_at.strftime('%b %d, %Y'),
            })
        return Response(rows)


class PlatformReportAssetsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        rows = []
        for a in Asset.objects.select_related('company', 'assigned_to', 'department').order_by('-created_at'):
            rows.append({
                'Asset': a.asset_tag,
                'Name': a.asset_name,
                'Category': a.get_category_display(),
                'Company': a.company.name,
                'Assigned To': (a.assigned_to.get_full_name() or a.assigned_to.username) if a.assigned_to else '—',
                'Department': a.department.name if a.department else '—',
                'Purchase Date': a.purchase_date.strftime('%b %d, %Y') if a.purchase_date else '—',
                'Status': a.get_status_display(),
            })
        return Response(rows)
