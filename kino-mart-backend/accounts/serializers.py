from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['phone_number', 'default_district', 'default_address']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id', 'username']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if profile_data is not None:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('That username is already taken.')
        return value

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number', '')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Profile.objects.create(user=user, phone_number=phone_number)
        return user


class KinoMartTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds a couple of convenience claims so the frontend doesn't need a second call."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token
