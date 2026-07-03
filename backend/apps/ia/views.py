from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import BaseConocimientoIA, PromptIA, ConfiguracionAgente
from .serializers import BaseConocimientoIASerializer, PromptIASerializer, ConfiguracionAgenteSerializer
from shared.permissions import IsAdmin, IsAdminOrAnalista


class BaseConocimientoIAViewSet(viewsets.ModelViewSet):
    queryset = BaseConocimientoIA.objects.select_related('creado_por').all()
    serializer_class   = BaseConocimientoIASerializer
    permission_classes = [IsAuthenticated, IsAdminOrAnalista]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['tipo', 'aplica_a', 'activo']
    search_fields      = ['nombre', 'descripcion']

    def perform_create(self, serializer):
        doc = serializer.save(creado_por=self.request.user)
        # Si tiene archivo, encolar extracción de texto
        if doc.archivo:
            from apps.ia.tasks import task_extraer_texto_documento
            task_extraer_texto_documento.delay(doc.pk)

    def perform_update(self, serializer):
        doc = serializer.save()
        if doc.archivo and not doc.contenido_extraido:
            from apps.ia.tasks import task_extraer_texto_documento
            task_extraer_texto_documento.delay(doc.pk)

    @action(detail=True, methods=['post'])
    def reextraer_texto(self, request, pk=None):
        """Relanza la extracción de texto del archivo subido."""
        doc = self.get_object()
        if not doc.archivo:
            return Response({'error': 'Sin archivo adjunto'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.ia.tasks import task_extraer_texto_documento
        task = task_extraer_texto_documento.delay(doc.pk)
        return Response({'task_id': task.id, 'status': 'enqueued'})


class ConfiguracionAgenteViewSet(viewsets.ModelViewSet):
    queryset           = ConfiguracionAgente.objects.select_related('creado_por').all()
    serializer_class   = ConfiguracionAgenteSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['modulo', 'activo', 'es_principal']


class PromptIAViewSet(viewsets.ModelViewSet):
    queryset = PromptIA.objects.select_related('actualizado_por').all()
    serializer_class   = PromptIASerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['modulo', 'activo']

    def perform_update(self, serializer):
        # Incrementa versión automáticamente en cada edición
        instance = self.get_object()
        serializer.save(
            actualizado_por=self.request.user,
            version=instance.version + 1,
        )
