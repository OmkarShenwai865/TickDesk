from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import update_last_login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from dashboard.permissions import IsCompanyAdmin
from .serializers import CompanySerializer


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

        if user_obj.company_id and not user_obj.company.is_active:
            raise serializers.ValidationError('This company account has been suspended. Contact TickDesk support.')

        data = super().validate(attrs)
        user = self.user
        update_last_login(None, user)
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


def _profile_dict(user):
    return {
        'id':         user.id,
        'username':   user.username,
        'email':      user.email,
        'first_name': user.first_name,
        'last_name':  user.last_name,
        'role':       user.role,
        'company':    user.company_id,
    }


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user

    if request.method == 'GET':
        return Response(_profile_dict(user))

    first_name = request.data.get('first_name', user.first_name)
    last_name  = request.data.get('last_name', user.last_name)
    email      = request.data.get('email', user.email).strip()

    if not email:
        return Response({'email': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    from .models import User as AppUser
    if AppUser.objects.exclude(pk=user.pk).filter(email=email).exists():
        return Response({'email': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    user.first_name = first_name
    user.last_name  = last_name
    user.email      = email
    user.save()
    return Response(_profile_dict(user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get('current_password', '')
    new_password      = request.data.get('new_password', '')

    if not user.check_password(current_password):
        return Response({'current_password': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as e:
        return Response({'new_password': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password updated.'})


class CompanySettingsView(generics.RetrieveUpdateAPIView):
    serializer_class   = CompanySerializer
    permission_classes = [IsCompanyAdmin]

    def get_object(self):
        return self.request.user.company
