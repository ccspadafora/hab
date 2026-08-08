from __future__ import annotations

from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import serializers

from apps.marketplace.perfiles_constructora.models import SolicitudCertificacionConstructora


class SolicitudCertificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudCertificacionConstructora
        fields = [
            'id', 'nombre_empresa', 'nit', 'contacto_nombre', 'contacto_email',
            'contacto_cargo', 'contacto_telefono', 'descripcion_empresa',
            'anios_experiencia', 'proyectos_ejecutados', 'zonas_interes',
            'tipos_proyecto', 'inversion_disponible', 'documentos',
            'estado', 'created_at',
        ]
        read_only_fields = ['id', 'estado', 'created_at']


class SolicitudCertificacionViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [AllowAny]
    queryset = SolicitudCertificacionConstructora.objects.all()
    serializer_class = SolicitudCertificacionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(
            SolicitudCertificacionSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )
