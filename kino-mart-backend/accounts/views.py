from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Profile
from .serializers import RegisterSerializer, UserSerializer, KinoMartTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = KinoMartTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        Profile.objects.get_or_create(user=self.request.user)
        return self.request.user
