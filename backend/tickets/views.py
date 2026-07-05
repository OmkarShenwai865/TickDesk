from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count

from .models import Ticket
from .serializers import TicketSerializer
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
            serializer.save(company=request.user.company, created_by=request.user)
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
        serializer = TicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ticket = self._get(pk, request.user.company)
        if not ticket:
            return Response(status=status.HTTP_404_NOT_FOUND)
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
