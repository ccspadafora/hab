from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Constructora, PermisoModulo

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar', 'is_active', 'created_at', 'date_joined',
        ]
        read_only_fields = ['id', 'created_at', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'phone', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ConstructoraSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Constructora
        fields = '__all__'


class PermisoModuloSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PermisoModulo
        fields = ['id', 'role', 'modulo', 'puede_ver', 'puede_editar']
