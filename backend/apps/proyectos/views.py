import logging

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Proyecto, EstructuracionProyecto, HitoProyecto, ProyectoPropietario
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .serializers import (
    ProyectoListSerializer,
    ProyectoDetalleSerializer,
    ProyectoWriteSerializer,
    EstructuracionProyectoSerializer,
    HitoProyectoSerializer,
)
from shared.permissions import IsAdminOrGerente, IsAdminOrAnalista

logger = logging.getLogger(__name__)


class ProyectoViewSet(viewsets.ModelViewSet):
    queryset = Proyecto.objects.select_related(
        'predio', 'analisis', 'gerente'
    ).prefetch_related(
        'estructuraciones', 'hitos', 'propietarios'
    ).all()
    permission_classes = [IsAuthenticated, IsAdminOrGerente]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['fase', 'gerente']
    search_fields      = ['nombre', 'codigo', 'slug']
    ordering_fields    = ['created_at', 'fase', 'valor_total_estimado']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProyectoDetalleSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProyectoWriteSerializer
        return ProyectoListSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def generar_estructuracion_ia(self, request, pk=None):
        """Encola la generación de estructuración financiera con IA."""
        proyecto = self.get_object()
        from apps.ia.tasks import task_generar_estructuracion_ia
        task = task_generar_estructuracion_ia.delay(proyecto.pk)
        logger.info(
            'proyectos.estructuracion_ia.encolada',
            extra={'proyecto_id': proyecto.pk, 'task_id': task.id},
        )
        return Response({'task_id': task.id, 'status': 'enqueued'})

    @action(detail=True, methods=['post'])
    def avanzar_fase(self, request, pk=None):
        """Avanza el proyecto a la siguiente fase del pipeline."""
        ORDEN = [f[0] for f in Proyecto._meta.get_field('fase').choices]
        proyecto = self.get_object()
        idx = ORDEN.index(proyecto.fase)
        if idx >= len(ORDEN) - 1:
            return Response({'error': 'El proyecto ya está en la fase final'}, status=400)
        proyecto.fase = ORDEN[idx + 1]
        proyecto.save(update_fields=['fase', 'updated_at'])
        return Response({'fase': proyecto.fase})

    @action(detail=True, methods=['post'])
    def hito(self, request, pk=None):
        proyecto  = self.get_object()
        serializer = HitoProyectoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(proyecto=proyecto)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='hito/(?P<hito_id>[0-9]+)/toggle')
    def toggle_hito(self, request, pk=None, hito_id=None):
        """Alterna completado/pendiente de un hito y actualiza fecha_real."""
        proyecto = self.get_object()
        hito = get_object_or_404(HitoProyecto, id=hito_id, proyecto=proyecto)
        hito.completado = not hito.completado
        hito.fecha_real = timezone.now().date() if hito.completado else None
        hito.save(update_fields=['completado', 'fecha_real'])
        total      = proyecto.hitos.count()
        completados = proyecto.hitos.filter(completado=True).count()
        return Response({
            'id': hito.id,
            'completado': hito.completado,
            'fecha_real': str(hito.fecha_real) if hito.fecha_real else None,
            'progreso': round(completados / total * 100) if total else 0,
        })

    @action(detail=True, methods=['post'])
    def agregar_propietario(self, request, pk=None):
        """Vincula un propietario al proyecto."""
        proyecto     = self.get_object()
        propietario_id  = request.data.get('propietario')
        porcentaje   = request.data.get('porcentaje_aporte', 100)
        pp, created = ProyectoPropietario.objects.get_or_create(
            proyecto=proyecto, propietario_id=propietario_id,
            defaults={'porcentaje_aporte': porcentaje},
        )
        return Response({'created': created, 'id': pp.id}, status=201)


class EstructuracionProyectoViewSet(viewsets.ModelViewSet):
    queryset           = EstructuracionProyecto.objects.select_related('proyecto', 'generada_por').all()
    serializer_class   = EstructuracionProyectoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrAnalista]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['proyecto', 'es_vigente', 'generada_por_ia']

    def perform_create(self, serializer):
        proyecto_id = self.request.data.get('proyecto')
        # Desactiva versiones anteriores antes de crear la nueva
        EstructuracionProyecto.objects.filter(
            proyecto_id=proyecto_id, es_vigente=True
        ).update(es_vigente=False)
        version = EstructuracionProyecto.objects.filter(
            proyecto_id=proyecto_id
        ).count() + 1
        serializer.save(
            generada_por=self.request.user,
            version=version,
            es_vigente=True,
        )
