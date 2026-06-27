from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import permission_classes
# Create your views here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response({
        "username" : request.user.username
    })