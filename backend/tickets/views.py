from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import Ticket, TicketAttachment, TicketComment, TicketActivity
from .serializers import (
    TicketSerializer, TicketAttachmentSerializer,
    TicketCommentSerializer, TicketActivitySerializer,
)
from dashboard.permissions import IsCompanyAdmin, IsCompanyMember, IsAgentOrAdmin

PAGE_SIZE = 10


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
        return Response({
            'total':       qs.count(),
            'open':        qs.filter(status=Ticket.STATUS_OPEN).count(),
            'in_progress': qs.filter(status=Ticket.STATUS_IN_PROGRESS).count(),
            'resolved':    qs.filter(status=Ticket.STATUS_RESOLVED).count(),
            'closed':      qs.filter(status=Ticket.STATUS_CLOSED).count(),
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
            from django.db.models import Q
            qs = qs.filter(Q(assigned_to=request.user) | Q(created_by=request.user))
        # admin sees all

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

            ticket = serializer.save(
                company=request.user.company,
                created_by=request.user,
                **({"assigned_to": auto_agent} if auto_agent else {}),
            )

            TicketActivity.objects.create(
                ticket=ticket,
                actor=request.user,
                action="Ticket created",
            )
            if auto_agent:
                TicketActivity.objects.create(
                    ticket=ticket,
                    actor=request.user,
                    action=f"Auto-assigned to {auto_agent.get_full_name() or auto_agent.username} (round-robin)",
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

            if updated.status != old_status:
                label = dict(Ticket.STATUS_CHOICES).get(updated.status, updated.status)
                TicketActivity.objects.create(
                    ticket=updated, actor=actor,
                    action=f"Status changed to {label}",
                )
            if updated.assigned_to_id != old_assigned_to:
                name = (updated.assigned_to.get_full_name() or updated.assigned_to.username) if updated.assigned_to else "nobody"
                TicketActivity.objects.create(
                    ticket=updated, actor=actor,
                    action=f"Assigned to {name}",
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
        return Response(TicketCommentSerializer(comments, many=True).data)

    def post(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Comment text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        comment = TicketComment.objects.create(ticket=ticket, author=request.user, text=text)

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

        return Response(TicketCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


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
