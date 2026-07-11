from django.urls import path
from . import views

urlpatterns = [
    path('',               views.AssetListCreateView.as_view(),  name='asset-list'),
    path('stats/',         views.AssetStatsView.as_view(),       name='asset-stats'),
    path('distribution/',  views.AssetDistributionView.as_view(), name='asset-distribution'),
    path('<int:pk>/',      views.AssetDetailView.as_view(),      name='asset-detail'),
    path('activity/',      views.AssetActivityView.as_view(),    name='asset-activity'),
]
