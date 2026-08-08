from __future__ import annotations

from rest_framework import serializers

from apps.auth_constructoras.models import ConstructoraPortalUser


class ConstructoraLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ConstructoraOTPSerializer(serializers.Serializer):
    telefono = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=6, required=False)


class ConstructoraPortalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConstructoraPortalUser
        fields = [
            'id',
            'telefono',
            'email',
            'telefono_verificado',
            'email_verificado',
            'activo',
            'constructora',
            'perfil_marketplace',
            'created_at',
            'ultimo_login',
        ]
        read_only_fields = fields
