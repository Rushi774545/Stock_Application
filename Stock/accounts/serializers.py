from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from .models import UserProfile


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"], password=validated_data["password"]
        )
        Token.objects.create(user=user)
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        try:
            user = User.objects.get(username=username)
            if not user.check_password(password):
                raise serializers.ValidationError("invalid credentials")
            attrs["user"] = user
            return attrs
        except User.DoesNotExist:
            raise serializers.ValidationError("invalid credentials")


class UserSerializer(serializers.ModelSerializer):
    unique_id = serializers.UUIDField(source="profile.unique_id", read_only=True)
    token = serializers.CharField(source="auth_token.key", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "unique_id", "token"]
