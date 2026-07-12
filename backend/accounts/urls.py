from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, profile, change_password, CompanySettingsView
from .dept_views import (
    DepartmentStatsView, DepartmentListCreateView, DepartmentDetailView,
    DepartmentEmployeeDistView, DepartmentTicketLoadView, DepartmentTopPerformingView,
)
from .user_views import (
    UserStatsView, UserListView, UserDetailView,
    UserRoleBreakdownView, UserDeptDistributionView,
    CompanyRegisterView, UserInviteView, UserBulkInviteView, UserInviteListView, UserInviteAcceptView,
)

urlpatterns = [
    path('register/', CompanyRegisterView.as_view(),       name='register'),
    path('login/',    CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(),          name='refresh'),
    path('profile/', profile,                              name='profile'),
    path('profile/change-password/', change_password,       name='change-password'),
    path('company/', CompanySettingsView.as_view(),        name='company-settings'),

    path('departments/',                    DepartmentListCreateView.as_view(),   name='dept-list'),
    path('departments/stats/',              DepartmentStatsView.as_view(),        name='dept-stats'),
    path('departments/employee-dist/',      DepartmentEmployeeDistView.as_view(), name='dept-emp-dist'),
    path('departments/ticket-load/',        DepartmentTicketLoadView.as_view(),   name='dept-ticket-load'),
    path('departments/top-performing/',     DepartmentTopPerformingView.as_view(),name='dept-top'),
    path('departments/<int:pk>/',           DepartmentDetailView.as_view(),       name='dept-detail'),

    path('users/',                          UserListView.as_view(),               name='user-list'),
    path('users/invite/',                   UserInviteView.as_view(),             name='user-invite'),
    path('users/invite/bulk/',              UserBulkInviteView.as_view(),         name='user-bulk-invite'),
    path('users/invitations/',              UserInviteListView.as_view(),         name='user-invite-list'),
    path('users/invite/<str:token>/accept/',UserInviteAcceptView.as_view(),       name='user-invite-accept'),
    path('users/stats/',                    UserStatsView.as_view(),              name='user-stats'),
    path('users/role-breakdown/',           UserRoleBreakdownView.as_view(),      name='user-role-breakdown'),
    path('users/dept-distribution/',        UserDeptDistributionView.as_view(),   name='user-dept-dist'),
    path('users/<int:pk>/',                 UserDetailView.as_view(),             name='user-detail'),
]
