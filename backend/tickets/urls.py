from django.urls import path
from . import views

urlpatterns = [
    path('',                       views.TicketListCreateView.as_view(),           name='ticket-list'),
    path('stats/',                 views.TicketStatsView.as_view(),                name='ticket-stats'),
    path('priority-distribution/', views.TicketPriorityDistributionView.as_view(), name='ticket-priority-dist'),
    path('<int:pk>/',              views.TicketDetailView.as_view(),               name='ticket-detail'),
    path('<int:pk>/attachments/',              views.TicketAttachmentView.as_view(),       name='ticket-attachments'),
    path('<int:pk>/attachments/<int:att_pk>/', views.TicketAttachmentDetailView.as_view(), name='ticket-attachment-detail'),
    path('<int:pk>/comments/',                 views.TicketCommentView.as_view(),          name='ticket-comments'),
    path('<int:pk>/activities/',               views.TicketActivityView.as_view(),         name='ticket-activities'),
]
