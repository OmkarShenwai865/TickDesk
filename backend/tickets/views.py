from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count

from .models import Ticket, TicketAttachment, TicketComment, TicketActivity
from .serializers import (
    TicketSerializer, TicketAttachmentSerializer,
    TicketCommentSerializer, TicketActivitySerializer,
)
from dashboard.permissions import IsCompanyAdmin

PAGE_SIZE = 10

_PRIORITY_COLORS = {
    'low':      '#16a34a',
    'medium':   '#d97706',
    'high':     '#ea580c',
    'critical': '#dc2626',
}


class TicketStatsView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        qs = Ticket.objects.filter(company=request.user.company)
        return Response({
            'total':       qs.count(),
            'open':        qs.filter(status=Ticket.STATUS_OPEN).count(),
            'in_progress': qs.filter(status=Ticket.STATUS_IN_PROGRESS).count(),
            'resolved':    qs.filter(status=Ticket.STATUS_RESOLVED).count(),
            'closed':      qs.filter(status=Ticket.STATUS_CLOSED).count(),
        })


class TicketPriorityDistributionView(APIView):
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        qs = (
            Ticket.objects
            .filter(company=request.user.company)
            .values('priority')
            .annotate(count=Count('id'))
        )
        total = Ticket.objects.filter(company=request.user.company).count()
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
    permission_classes = [IsCompanyAdmin]

    def get(self, request):
        qs = (
            Ticket.objects
            .filter(company=request.user.company)
            .select_related('created_by', 'assigned_to', 'department')
            .order_by('-created_at')
        )

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
            ticket = serializer.save(company=request.user.company, created_by=request.user)
            TicketActivity.objects.create(
                ticket=ticket,
                actor=request.user,
                action="Ticket created",
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketDetailView(APIView):
    permission_classes = [IsCompanyAdmin]

    def _get(self, pk, company):
        try:
            return Ticket.objects.select_related(
                'created_by', 'assigned_to', 'department'
            ).get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
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
    permission_classes = [IsCompanyAdmin]

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
    permission_classes = [IsCompanyAdmin]

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
        return Response(TicketCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class TicketActivityView(APIView):
    permission_classes = [IsCompanyAdmin]

    def _get_ticket(self, pk, company):
        try:
            return Ticket.objects.get(pk=pk, company=company)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, pk):
        ticket = self._get_ticket(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        activities = ticket.activities.select_related('actor').all()
        return Response(TicketActivitySerializer(activities, many=True).data)
