from django.urls import path
from .views import (
    PlatformCompanyListView, PlatformCompanyDetailView, PlatformCompanyResetPasswordView,
    PlatformDashboardStatsView, PlatformAnnouncementView,
    PlatformReportCompaniesView, PlatformReportUsersView, PlatformReportTicketsView, PlatformReportAssetsView,
)

urlpatterns = [
    path('dashboard/',                    PlatformDashboardStatsView.as_view(),        name='platform-dashboard'),
    path('companies/',                    PlatformCompanyListView.as_view(),           name='platform-companies'),
    path('companies/<int:pk>/',           PlatformCompanyDetailView.as_view(),         name='platform-company-detail'),
    path('companies/<int:pk>/reset-password/', PlatformCompanyResetPasswordView.as_view(), name='platform-company-reset-password'),
    path('announcements/',                PlatformAnnouncementView.as_view(),          name='platform-announcements'),
    path('reports/companies/',            PlatformReportCompaniesView.as_view(),        name='platform-report-companies'),
    path('reports/users/',                PlatformReportUsersView.as_view(),            name='platform-report-users'),
    path('reports/tickets/',              PlatformReportTicketsView.as_view(),          name='platform-report-tickets'),
    path('reports/assets/',               PlatformReportAssetsView.as_view(),           name='platform-report-assets'),
]
