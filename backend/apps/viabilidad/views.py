from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import AnalisisViabilidad
from .serializers import AnalisisViabilidadSerializer
from shared.permissions import IsAdminOrAnalista


class AnalisisViabilidadViewSet(viewsets.ModelViewSet):
    queryset = AnalisisViabilidad.objects.select_related('predio', 'analista').all()
    serializer_class   = AnalisisViabilidadSerializer
    permission_classes = [IsAuthenticated, IsAdminOrAnalista]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['es_viable', 'analista']
    ordering_fields    = ['solicitado_en', 'completado_en', 'score_viabilidad']

    def perform_create(self, serializer):
        serializer.save(analista=self.request.user)

    @action(detail=True, methods=['post'])
    def recalcular(self, request, pk=None):
        """Relanza el cálculo de viabilidad y score IA manualmente."""
        analisis = self.get_object()
        from apps.viabilidad.tasks import task_analizar_viabilidad_predio
        task = task_analizar_viabilidad_predio.delay(analisis.pk)
        return Response({'task_id': task.id, 'status': 'enqueued'})

    @action(detail=True, methods=['patch'])
    def marcar_viable(self, request, pk=None):
        analisis = self.get_object()
        analisis.es_viable = True
        analisis.notas = request.data.get('notas', analisis.notas)
        analisis.save(update_fields=['es_viable', 'notas'])
        analisis.predio.estado = 'viable'
        analisis.predio.save(update_fields=['estado'])
        return Response(AnalisisViabilidadSerializer(analisis).data)

    @action(detail=True, methods=['patch'])
    def marcar_no_viable(self, request, pk=None):
        analisis = self.get_object()
        analisis.es_viable = False
        analisis.razon_no_viabilidad = request.data.get('razon', '')
        analisis.save(update_fields=['es_viable', 'razon_no_viabilidad'])
        analisis.predio.estado = 'no_viable'
        analisis.predio.save(update_fields=['estado'])
        return Response(AnalisisViabilidadSerializer(analisis).data)
