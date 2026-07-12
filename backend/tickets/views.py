from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import Ticket, TicketAttachment, TicketComment, TicketActivity, TicketNote
from .serializers import (
    TicketSerializer, TicketAttachmentSerializer,
    TicketCommentSerializer, TicketActivitySerializer, TicketNoteSerializer,
)
from dashboard.permissions import IsCompanyAdmin, IsCompanyMember, IsAgentOrAdmin

PAGE_SIZE = 10


# ─── Rule-based priority suggestion ───────────────────────────────────────────

_CRITICAL_WORDS = {
    'down', 'outage', 'breach', 'hacked', 'ransomware', 'data loss', 'not working',
    'crashed', 'crash', 'unresponsive', 'offline', 'emergency', 'production down',
    'server down', 'database down', 'system down', 'completely broken', 'security incident',
}
_HIGH_WORDS = {
    'urgent', 'broken', 'cannot access', "can't access", 'cant access', 'blocked',
    'unable to login', 'unable to log in', 'password reset', 'locked out', 'not responding',
    'failed', 'failure', 'corrupted', 'virus', 'malware', 'lost data', 'deleted',
    'deadline', 'meeting', 'asap', 'immediately', 'critical issue',
}
_MEDIUM_WORDS = {
    'slow', 'error', 'issue', 'problem', 'intermittent', 'sometimes', 'occasionally',
    'keeps', 'freezing', 'freeze', 'hanging', 'lag', 'laggy', 'not syncing', 'sync issue',
    'permission', 'access denied', 'cannot open', "can't open", 'glitch', 'bug',
}


def suggest_priority(title: str, description: str) -> str:
    text = (title + ' ' + description).lower()
    for phrase in _CRITICAL_WORDS:
        if phrase in text:
            return 'critical'
    for phrase in _HIGH_WORDS:
        if phrase in text:
            return 'high'
    for phrase in _MEDIUM_WORDS:
        if phrase in text:
            return 'medium'
    return 'low'


# ─── Auto-assignment: least-loaded agent, round-robin on ties ─────────────────

def get_auto_assignee(company):
    """
    Pick the agent with the fewest open/in-progress tickets.
    On a tie, rotate by looking at who was last assigned and picking the next
    agent in sorted-by-id order.
    """
    from accounts.models import User

    agents = list(
        User.objects
        .filter(company=company, role='agent', is_active=True)
        .annotate(
            open_count=Count(
                'assigned_tickets',
                filter=Q(assigned_tickets__status__in=['open', 'in_progress'])
            )
        )
        .order_by('open_count', 'id')
    )

    if not agents:
        return None

    min_load = agents[0].open_count
    tied = [a for a in agents if a.open_count == min_load]

    if len(tied) == 1:
        return tied[0]

    # Round-robin among tied agents based on last assignment
    last_ticket = (
        Ticket.objects
        .filter(company=company, assigned_to__in=tied)
        .order_by('-created_at')
        .first()
    )

    if not last_ticket or not last_ticket.assigned_to_id:
        return tied[0]

    ids = [a.id for a in tied]
    try:
        idx = ids.index(last_ticket.assigned_to_id)
        return tied[(idx + 1) % len(tied)]
    except ValueError:
        return tied[0]

_PRIORITY_COLORS = {
    'low':      '#16a34a',
    'medium':   '#d97706',
    'high':     '#ea580c',
    'critical': '#dc2626',
}


def _agent_qs(user):
    from django.db.models import Q
    return Ticket.objects.filter(
        company=user.company
    ).filter(Q(assigned_to=user) | Q(created_by=user))


AUTO_CLOSE_DAYS = 2


def _auto_close_resolved(company):
    """Close tickets that have been in 'resolved' for AUTO_CLOSE_DAYS days."""
    cutoff = timezone.now() - timedelta(days=AUTO_CLOSE_DAYS)
    stale = Ticket.objects.filter(
        company=company,
        status=Ticket.STATUS_RESOLVED,
        updated_at__lte=cutoff,
    )
    for ticket in stale:
        ticket.status = Ticket.STATUS_CLOSED
        ticket.save(update_fields=['status', 'updated_at'])
        TicketActivity.objects.create(
            ticket=ticket,
            actor=None,
            action=f"Auto-closed after {AUTO_CLOSE_DAYS} days in Resolved",
        )


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


class TicketStatsView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        role = getattr(request.user, 'role', 'employee')
        if role == 'admin':
            qs = Ticket.objects.filter(company=request.user.company)
        elif role == 'agent':
            qs = _agent_qs(request.user)
        else:
            qs = Ticket.objects.filter(company=request.user.company, created_by=request.user)

        now = timezone.now()
        cutoff_30 = now - timedelta(days=30)
        months = _last_6_month_starts(now)

        def _delta(filtered_qs):
            n = filtered_qs.filter(created_at__gte=cutoff_30).count()
            return 'steady' if n == 0 else f'+{n} vs last month'

        total_qs       = qs
        open_qs        = qs.filter(status=Ticket.STATUS_OPEN)
        in_progress_qs = qs.filter(status=Ticket.STATUS_IN_PROGRESS)
        resolved_qs    = qs.filter(status=Ticket.STATUS_RESOLVED)
        closed_qs      = qs.filter(status=Ticket.STATUS_CLOSED)

        return Response({
            'total':       total_qs.count(),
            'open':        open_qs.count(),
            'in_progress': in_progress_qs.count(),
            'resolved':    resolved_qs.count(),
            'closed':      closed_qs.count(),
            'total_delta':       _delta(total_qs),
            'open_delta':        _delta(open_qs),
            'in_progress_delta': _delta(in_progress_qs),
            'resolved_delta':    _delta(resolved_qs),
            'total_trend':       _per_month_trend(total_qs, months, now),
            'open_trend':        _per_month_trend(open_qs, months, now),
            'in_progress_trend': _per_month_trend(in_progress_qs, months, now),
            'resolved_trend':    _per_month_trend(resolved_qs, months, now),
        })


class TicketPriorityDistributionView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        role = getattr(request.user, 'role', 'employee')
        if role == 'admin':
            base_qs = Ticket.objects.filter(company=request.user.company)
        elif role == 'agent':
            base_qs = _agent_qs(request.user)
        else:
            base_qs = Ticket.objects.filter(company=request.user.company, created_by=request.user)
        qs = base_qs.values('priority').annotate(count=Count('id'))
        total = base_qs.count()
        order = ['critical', 'high', 'medium', 'low']
        rows  = {row['priority']: row['count'] for row in qs}

        return Response([
            {
                'label': p.capitalize(),
                'count': rows.get(p, 0),
                'pct':   round(rows.get(p, 0) / total * 100) if total else 0,
                'color': _PRIORITY_COLORS[p],
            }
            for p in order
        ])


class TicketListCreateView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        _auto_close_resolved(request.user.company)
        qs = (
            Ticket.objects
            .filter(company=request.user.company)
            .select_related('created_by', 'assigned_to', 'department')
            .order_by('-created_at')
        )

        # Role-based filtering
        role = getattr(request.user, 'role', 'employee')
        if role == 'employee':
            qs = qs.filter(created_by=request.user)
        elif role == 'agent':
            qs = qs.filter(Q(assigned_to=request.user) | Q(created_by=request.user))
        # admin sees all

        # Admin-only "My Tickets" toggle — show only tickets created by or assigned to the admin
        if role == 'admin' and request.query_params.get('my_tickets') == '1':
            qs = qs.filter(Q(created_by=request.user) | Q(assigned_to=request.user))

        if role == 'admin':
            dept = request.query_params.get('department', '').strip()
            if dept:
                qs = qs.filter(department_id=dept)

        status_filter = request.query_params.get('status')
        search        = request.query_params.get('search', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(title__icontains=search)

        total    = qs.count()
        page     = max(1, int(request.query_params.get('page', 1)))
        per_page = int(request.query_params.get('page_size', PAGE_SIZE))
        start    = (page - 1) * per_page

        return Response({
            'count':     total,
            'page':      page,
            'page_size': per_page,
            'results':   TicketSerializer(qs[start:start + per_page], many=True).data,
        })

    def post(self, request):
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            role = getattr(request.user, 'role', 'employee')
            manual_assignee = request.data.get('assigned_to')

            # Auto-assign when employee creates ticket and hasn't picked an agent
            auto_agent = None
            if role == 'employee' and not manual_assignee:
                auto_agent = get_auto_assignee(request.user.company)

            # For employees, always override priority with AI detection
            extra = {}
            if role == 'employee':
                title       = request.data.get('title', '')
                description = request.data.get('description', '')
                extra['priority'] = suggest_priority(title, description)

            ticket = serializer.save(
                company=request.user.company,
                created_by=request.user,
                **({"assigned_to": auto_agent} if auto_agent else {}),
                **extra,
            )

            from notifications.utils import notify
            TicketActivity.objects.create(
                ticket=ticket,
                actor=request.user,
                action="Ticket created",
            )
            if auto_agent:
                TicketActivity.objects.create(
                    ticket=ticket,
                    actor=request.user,
                    action=f"Auto-assigned to {auto_agent.get_full_name() or auto_agent.username}",
                )
                notify(
                    auto_agent,
                    'ticket_assigned',
                    f"New ticket assigned: {ticket.ticket_number}",
                    ticket.title,
                    f"/tickets/{ticket.id}",
                )

            return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketDetailView(APIView):
    permission_classes = [IsCompanyMember]

    def _get(self, pk, company):
        try:
            return Ticket.objects.select_related(
                'created_by', 'assigned_to', 'department'
            ).get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
        _auto_close_resolved(request.user.company)
        ticket = self._get(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(TicketSerializer(ticket).data)

    def patch(self, request, pk):
        ticket = self._get(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)

        old_status      = ticket.status
        old_assigned_to = ticket.assigned_to_id
        old_priority    = ticket.priority

        serializer = TicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            actor = request.user
            from notifications.utils import notify

            if updated.status != old_status:
                label = dict(Ticket.STATUS_CHOICES).get(updated.status, updated.status)
                TicketActivity.objects.create(
                    ticket=updated, actor=actor,
                    action=f"Status changed to {label}",
                )
                # Notify the requester about status change
                if updated.created_by and updated.created_by != actor:
                    notify(
                        updated.created_by,
                        'ticket_status',
                        f"Ticket {updated.ticket_number} is now {label}",
                        updated.title,
                        f"/tickets/{updated.id}",
                    )
            if updated.assigned_to_id != old_assigned_to:
                name = (updated.assigned_to.get_full_name() or updated.assigned_to.username) if updated.assigned_to else "nobody"
                TicketActivity.objects.create(
                    ticket=updated, actor=actor,
                    action=f"Assigned to {name}",
                )
                # Notify the newly assigned agent
                if updated.assigned_to and updated.assigned_to != actor:
                    notify(
                        updated.assigned_to,
                        'ticket_assigned',
                        f"Ticket assigned to you: {updated.ticket_number}",
                        updated.title,
                        f"/tickets/{updated.id}",
                    )
            if updated.priority != old_priority:
                label = dict(Ticket.PRIORITY_CHOICES).get(updated.priority, updated.priority)
                TicketActivity.objects.create(
                    ticket=updated, actor=actor,
                    action=f"Priority changed to {label}",
                )

            return Response(TicketSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ticket = self._get(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024   # 50 MB
ALLOWED_MIME_PREFIXES = ('image/', 'application/pdf', 'text/')
ALLOWED_EXTENSIONS = {
    '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp',
    '.txt', '.csv', '.doc', '.docx', '.xls', '.xlsx', '.zip',
    '.mp4', '.mov', '.avi', '.webm', '.mkv',
}


class TicketAttachmentView(APIView):
    permission_classes = [IsCompanyMember]

    def _get_ticket(self, pk, company):
        try:
            return Ticket.objects.get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        attachments = ticket.attachments.all()
        return Response(TicketAttachmentSerializer(
            attachments, many=True, context={'request': request}
        ).data)

    def post(self, request, pk):
        import os
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > MAX_ATTACHMENT_SIZE:
            return Response(
                {'detail': f'File too large. Maximum size is 10 MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {'detail': f'File type "{ext}" is not allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attachment = TicketAttachment.objects.create(
            ticket=ticket,
            file=file,
            original_name=file.name,
            file_size=file.size,
            uploaded_by=request.user,
        )
        TicketActivity.objects.create(
            ticket=ticket, actor=request.user,
            action=f"Attached file: {file.name}",
        )
        return Response(
            TicketAttachmentSerializer(attachment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class TicketAttachmentDetailView(APIView):
    permission_classes = [IsCompanyAdmin]

    def delete(self, request, pk, att_pk):
        try:
            ticket = Ticket.objects.get(pk=pk, company=request.user.company)
        except Ticket.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            attachment = TicketAttachment.objects.get(pk=att_pk, ticket=ticket)
        except TicketAttachment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        name = attachment.original_name
        attachment.file.delete(save=False)
        attachment.delete()
        TicketActivity.objects.create(
            ticket=ticket, actor=request.user,
            action=f"Removed attachment: {name}",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TicketCommentView(APIView):
    permission_classes = [IsCompanyMember]

    def _get_ticket(self, pk, company):
        try:
            return Ticket.objects.get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        comments = ticket.comments.select_related('author').all()
        return Response(TicketCommentSerializer(comments, many=True, context={'request': request}).data)

    def post(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)

        text = request.data.get('text', '').strip()
        file = request.FILES.get('file')

        if not text and not file:
            return Response({'detail': 'Message or file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if file and file.size > 10 * 1024 * 1024:
            return Response({'detail': 'File too large. Maximum allowed size is 10 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = TicketComment.objects.create(
            ticket=ticket,
            author=request.user,
            text=text,
            **({"file": file, "original_name": file.name} if file else {}),
        )

        from notifications.utils import notify
        sender_name = request.user.get_full_name() or request.user.username

        # Notify assigned agent when requester comments
        if ticket.assigned_to and ticket.assigned_to != request.user:
            notify(
                ticket.assigned_to,
                'ticket_comment',
                f"New message on {ticket.ticket_number}",
                f"{sender_name}: {text[:80]}" if text else f"{sender_name} sent a file",
                f"/tickets/{ticket.id}",
            )
        # Notify requester when agent/admin comments
        if ticket.created_by and ticket.created_by != request.user:
            notify(
                ticket.created_by,
                'ticket_comment',
                f"New reply on {ticket.ticket_number}",
                f"{sender_name}: {text[:80]}" if text else f"{sender_name} sent a file",
                f"/tickets/{ticket.id}",
            )

        # Auto → In Progress when the assigned agent replies for the first time
        if (
            ticket.status == Ticket.STATUS_OPEN
            and ticket.assigned_to_id == request.user.id
            and getattr(request.user, 'role', '') == 'agent'
        ):
            ticket.status = Ticket.STATUS_IN_PROGRESS
            ticket.save(update_fields=['status', 'updated_at'])
            TicketActivity.objects.create(
                ticket=ticket,
                actor=request.user,
                action="Status changed to In Progress (agent replied)",
            )

        return Response(
            TicketCommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class TicketActivityView(APIView):
    permission_classes = [IsCompanyMember]

    def _get_ticket(self, pk, company):
        try:
            return Ticket.objects.get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        activities = ticket.activities.select_related('actor').order_by('created_at')
        return Response(TicketActivitySerializer(activities, many=True).data)


class TicketNoteView(APIView):
    permission_classes = [IsAgentOrAdmin]

    def _get_ticket(self, pk, company):
        try:
            return Ticket.objects.get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        notes = ticket.notes.select_related('author').all()
        return Response(TicketNoteSerializer(notes, many=True).data)

    def post(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Note text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        note = TicketNote.objects.create(ticket=ticket, author=request.user, text=text)

        from notifications.utils import notify
        sender_name = request.user.get_full_name() or request.user.username
        # Notify the assigned agent (if it's not the note author)
        if ticket.assigned_to and ticket.assigned_to != request.user:
            notify(
                ticket.assigned_to,
                'ticket_comment',
                f"Internal note on {ticket.ticket_number}",
                f"{sender_name}: {text[:80]}",
                f"/tickets/{ticket.id}",
            )

        return Response(TicketNoteSerializer(note).data, status=status.HTTP_201_CREATED)


class SuggestPriorityView(APIView):
    permission_classes = [IsCompanyMember]

    def post(self, request):
        title       = request.data.get('title', '')
        description = request.data.get('description', '')
        priority    = suggest_priority(title, description)
        return Response({'priority': priority})
