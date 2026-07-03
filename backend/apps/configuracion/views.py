from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import ConfiguracionSistema, ConfiguracionScraping, ConfiguracionIA
from .serializers import (
    ConfiguracionSistemaSerializer,
    ConfiguracionScrapingSerializer,
    ConfiguracionIASerializer,
)
from shared.permissions import IsAdmin


class ConfiguracionSistemaViewSet(viewsets.ModelViewSet):
    queryset           = ConfiguracionSistema.objects.all()
    serializer_class   = ConfiguracionSistemaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['categoria', 'tipo', 'editable_frontend']
    search_fields      = ['clave', 'descripcion']

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Devuelve las configs agrupadas por categoría."""
        categoria = request.query_params.get('categoria')
        qs = self.get_queryset()
        if categoria:
            qs = qs.filter(categoria=categoria)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ConfiguracionScrapingViewSet(viewsets.ModelViewSet):
    queryset           = ConfiguracionScraping.objects.select_related('fuente').all()
    serializer_class   = ConfiguracionScrapingSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class ConfiguracionIAView(APIView):
    """Singleton — GET devuelve la config actual, PATCH la actualiza."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        config = ConfiguracionIA.get()
        return Response(ConfiguracionIASerializer(config).data)

    def patch(self, request):
        config     = ConfiguracionIA.get()
        serializer = ConfiguracionIASerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
