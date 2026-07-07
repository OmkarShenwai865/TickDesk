from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, profile
from .dept_views import (
    DepartmentStatsView, DepartmentListCreateView, DepartmentDetailView,
    DepartmentEmployeeDistView, DepartmentTicketLoadView, DepartmentTopPerformingView,
)
from .user_views import (
    UserStatsView, UserListView, UserDetailView,
    UserRoleBreakdownView, UserDeptDistributionView,
)

urlpatterns = [
    path('login/',   CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(),          name='refresh'),
    path('profile/', profile,                              name='profile'),

    path('departments/',                    DepartmentListCreateView.as_view(),   name='dept-list'),
    path('departments/stats/',              DepartmentStatsView.as_view(),        name='dept-stats'),
    path('departments/employee-dist/',      DepartmentEmployeeDistView.as_view(), name='dept-emp-dist'),
    path('departments/ticket-load/',        DepartmentTicketLoadView.as_view(),   name='dept-ticket-load'),
    path('departments/top-performing/',     DepartmentTopPerformingView.as_view(),name='dept-top'),
    path('departments/<int:pk>/',           DepartmentDetailView.as_view(),       name='dept-detail'),

    path('users/',                          UserListView.as_view(),               name='user-list'),
    path('users/stats/',                    UserStatsView.as_view(),              name='user-stats'),
    path('users/role-breakdown/',           UserRoleBreakdownView.as_view(),      name='user-role-breakdown'),
    path('users/dept-distribution/',        UserDeptDistributionView.as_view(),   name='user-dept-dist'),
    path('users/<int:pk>/',                 UserDetailView.as_view(),             name='user-detail'),
]
