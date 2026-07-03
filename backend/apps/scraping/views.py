from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import FuenteScraping, ZonaPOT, Predio, EjecucionScraping
from .serializers import (
    FuenteScrapingSerializer,
    ZonaPOTSerializer,
    PredioListSerializer,
    PredioDetalleSerializer,
    PredioCreateSerializer,
    EjecucionScrapingSerializer,
)
from shared.permissions import IsAdminOrAnalista


class FuenteScrapingViewSet(viewsets.ModelViewSet):
    queryset           = FuenteScraping.objects.all()
    serializer_class   = FuenteScrapingSerializer
    permission_classes = [IsAuthenticated, IsAdminOrAnalista]

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        fuente = self.get_object()
        from apps.scraping.tasks import task_ejecutar_scraping_fuente
        task = task_ejecutar_scraping_fuente.delay(fuente.pk)
        return Response({'task_id': task.id, 'status': 'enqueued'})


class ZonaPOTViewSet(viewsets.ModelViewSet):
    queryset           = ZonaPOT.objects.all()
    serializer_class   = ZonaPOTSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['nombre_zona', 'barrio', 'localidad']


class PredioViewSet(viewsets.ModelViewSet):
    queryset = Predio.objects.select_related('fuente').all()
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['estado', 'tipo', 'estrato', 'barrio', 'localidad']
    search_fields      = ['barrio', 'localidad', 'direccion', 'codigo_externo']
    ordering_fields    = ['score_prefactibilidad', 'primera_deteccion', 'precio_publicado']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PredioDetalleSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return PredioCreateSerializer
        return PredioListSerializer

    @action(detail=True, methods=['get'])
    def propietarios(self, request, pk=None):
        """Devuelve propietarios asociados al predio."""
        predio = self.get_object()
        from apps.leads.serializers import PropietarioSerializer
        from apps.leads.models import Propietario
        props = Propietario.objects.filter(predios=predio)
        return Response(PropietarioSerializer(props, many=True).data)

    @action(detail=True, methods=['post'])
    def agregar_propietario(self, request, pk=None):
        """Asocia un propietario al predio."""
        predio = self.get_object()
        from apps.leads.models import Propietario, PropietarioPredio
        propietario_id = request.data.get('propietario')
        rol = request.data.get('rol', 'propietario')
        porcentaje = request.data.get('porcentaje_propiedad', 100)
        pp, created = PropietarioPredio.objects.get_or_create(
            propietario_id=propietario_id, predio=predio, rol=rol,
            defaults={'porcentaje_propiedad': porcentaje}
        )
        return Response({'created': created, 'id': pp.id}, status=201)

    @action(detail=True, methods=['get'])
    def proyectos(self, request, pk=None):
        """Devuelve proyectos vinculados al predio."""
        predio = self.get_object()
        from apps.proyectos.serializers import ProyectoListSerializer
        from apps.proyectos.models import Proyecto
        proyectos = Proyecto.objects.filter(predio=predio)
        return Response(ProyectoListSerializer(proyectos, many=True).data)

    @action(detail=True, methods=['post'])
    def recalcular_prefactibilidad(self, request, pk=None):
        predio = self.get_object()
        from apps.scraping.tasks import task_calcular_prefactibilidad
        task = task_calcular_prefactibilidad.delay(predio.pk)
        return Response({'task_id': task.id, 'status': 'enqueued'})

    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        """Agrupa predios por estado para la vista kanban."""
        from apps.scraping.models import ESTADO_PREDIO_CHOICES
        qs = self.get_queryset()
        result = {}
        for estado, label in ESTADO_PREDIO_CHOICES:
            predios = qs.filter(estado=estado)
            result[estado] = {
                'label':   label,
                'count':   predios.count(),
                'predios': PredioListSerializer(predios[:50], many=True).data,
            }
        return Response(result)
