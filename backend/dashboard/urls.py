from django.urls import path
from . import views

urlpatterns = [
    path('stats/',              views.DashboardStatsView.as_view(),    name='dashboard-stats'),
    path('ticket-status/',      views.TicketStatusView.as_view(),      name='dashboard-ticket-status'),
    path('asset-distribution/', views.AssetDistributionView.as_view(), name='dashboard-asset-distribution'),
    path('recent-tickets/',     views.RecentTicketsView.as_view(),     name='dashboard-recent-tickets'),
    path('recent-assets/',      views.RecentAssetsView.as_view(),      name='dashboard-recent-assets'),
]
