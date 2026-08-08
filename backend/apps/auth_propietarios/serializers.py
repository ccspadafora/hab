from __future__ import annotations

from rest_framework import serializers

from apps.auth_propietarios.models import PropietarioPortalUser


class RegistroPropietarioSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200)
    telefono = serializers.RegexField(
        regex=r'^\+\d{7,15}$',
        max_length=20,
        error_messages={'invalid': 'Teléfono debe estar en formato E.164 (+57...)'},
    )
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    password = serializers.CharField(min_length=8, write_only=True)


class LoginPropietarioSerializer(serializers.Serializer):
    telefono = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)


class SolicitarOTPSerializer(serializers.Serializer):
    telefono = serializers.CharField(max_length=20)


class VerificarOTPSerializer(serializers.Serializer):
    telefono = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=6)


class PropietarioPortalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropietarioPortalUser
        fields = [
            'id',
            'telefono',
            'email',
            'telefono_verificado',
            'activo',
            'created_at',
            'ultimo_login',
            'propietario',
        ]
        read_only_fields = fields
