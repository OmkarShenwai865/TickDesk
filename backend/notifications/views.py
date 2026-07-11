from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.timesince import timesince

from dashboard.permissions import IsCompanyMember
from .models import Notification


def _serialize(n):
    return {
        'id':         n.id,
        'type':       n.notif_type,
        'title':      n.title,
        'body':       n.body,
        'link':       n.link,
        'is_read':    n.is_read,
        'time':       timesince(n.created_at) + ' ago',
        'created_at': n.created_at.isoformat(),
    }


class NotificationListView(APIView):
    permission_classes = [IsCompanyMember]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)[:30]
        unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({
            'unread':  unread,
            'results': [_serialize(n) for n in qs],
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsCompanyMember]

    def patch(self, request, pk):
        try:
            n = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        n.is_read = True
        n.save(update_fields=['is_read'])
        return Response({'ok': True})


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsCompanyMember]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'ok': True})
