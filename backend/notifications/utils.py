from .models import Notification


def notify(recipient, notif_type, title, body='', link=''):
    if recipient is None:
        return
    Notification.objects.create(
        recipient=recipient,
        notif_type=notif_type,
        title=title,
        body=body,
        link=link,
    )
