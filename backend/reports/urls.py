from django.urls import path
from .views import (
    ReportsSummaryView, TicketTrendsView, TicketsByStatusView,
    TicketsByDeptView, AssetsByCategoryView, TopAgentsView, SystemHealthView,
)

urlpatterns = [
    path('summary/',          ReportsSummaryView.as_view(),  name='reports-summary'),
    path('ticket-trends/',    TicketTrendsView.as_view(),    name='reports-trends'),
    path('tickets-by-status/', TicketsByStatusView.as_view(), name='reports-by-status'),
    path('tickets-by-dept/',  TicketsByDeptView.as_view(),   name='reports-by-dept'),
    path('assets-by-category/', AssetsByCategoryView.as_view(), name='reports-assets-cat'),
    path('top-agents/',       TopAgentsView.as_view(),       name='reports-top-agents'),
    path('system-health/',    SystemHealthView.as_view(),    name='reports-health'),
]
