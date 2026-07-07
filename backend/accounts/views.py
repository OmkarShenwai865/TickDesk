from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extend the default JWT response to include user info.

    Accepts either username or email in the username field so that users
    created from the admin UI can log in with the email they registered with.
    """

    def validate(self, attrs):
        from .models import User as AppUser
        from rest_framework import serializers

        email = attrs.get('username', '')
        try:
            user_obj = AppUser.objects.get(email=email)
            attrs['username'] = user_obj.username
        except AppUser.DoesNotExist:
            raise serializers.ValidationError('No account found with this email address.')

        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'role':     user.role,
            'company':  user.company_id,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    return Response({
        'id':         user.id,
        'username':   user.username,
        'email':      user.email,
        'first_name': user.first_name,
        'last_name':  user.last_name,
        'role':       user.role,
        'company':    user.company_id,
    })
