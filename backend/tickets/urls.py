from django.urls import path
from . import views

urlpatterns = [
    path('',                       views.TicketListCreateView.as_view(),          name='ticket-list'),
    path('stats/',                 views.TicketStatsView.as_view(),               name='ticket-stats'),
    path('priority-distribution/', views.TicketPriorityDistributionView.as_view(), name='ticket-priority-dist'),
    path('<int:pk>/',              views.TicketDetailView.as_view(),              name='ticket-detail'),
]
