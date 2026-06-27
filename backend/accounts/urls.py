from django.urls import path
from .views import profile
from rest_framework_simplejwt.views import (TokenObtainPairView,TokenRefreshView)

urlpatterns = [
    path('login/',TokenObtainPairView.as_view(), name='login'),
    path('refresh/',TokenRefreshView.as_view(),name='refresh'),
    path('profile/',profile, name='profile'),
]
