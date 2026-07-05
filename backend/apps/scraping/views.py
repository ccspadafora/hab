from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
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
        ejecucion = EjecucionScraping.objects.create(
            fuente=fuente,
            inicio=timezone.now(),
            estado='pendiente',
            log='Scraping encolado desde el panel.',
        )
        task = task_ejecutar_scraping_fuente.delay(fuente.pk, ejecucion.pk)
        return Response({
            'task_id': task.id,
            'status': 'enqueued',
            'ejecucion': EjecucionScrapingSerializer(ejecucion).data,
        })

    @action(detail=True, methods=['get'])
    def ejecuciones(self, request, pk=None):
        fuente = self.get_object()
        qs = fuente.ejecuciones.order_by('-inicio')[:10]
        return Response(EjecucionScrapingSerializer(qs, many=True).data)


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
    search_fields      = ['barrio', 'localidad', 'ciudad', 'direccion', 'codigo_externo']
    ordering_fields    = ['score_prefactibilidad', 'primera_deteccion', 'precio_publicado']

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        def _list_param(name: str):
            raw = params.getlist(name)
            if len(raw) == 1 and ',' in raw[0]:
                raw = raw[0].split(',')
            return [item.strip() for item in raw if str(item).strip()]

        ciudades = _list_param('ciudades')
        if not ciudades and params.get('ciudad'):
            ciudades = [params.get('ciudad', '').strip()]
        if ciudades:
            qs = qs.filter(ciudad__in=ciudades)

        localidades = _list_param('localidades')
        if localidades:
            qs = qs.filter(localidad__in=localidades)

        barrios = _list_param('barrios')
        if barrios:
            query = Q()
            for barrio in barrios:
                query |= Q(barrio__iexact=barrio)
            qs = qs.filter(query)

        tipos = _list_param('tipos')
        if tipos:
            qs = qs.filter(tipo__in=tipos)

        for field, cast in (
            ('estrato_min', int),
            ('estrato_max', int),
            ('score_min', float),
            ('score_max', float),
            ('precio_min', float),
            ('precio_max', float),
            ('area_min', float),
            ('area_max', float),
        ):
            raw = params.get(field)
            if raw in (None, ''):
                continue
            try:
                value = cast(raw)
            except (TypeError, ValueError):
                continue
            lookup = {
                'estrato_min': 'estrato__gte',
                'estrato_max': 'estrato__lte',
                'score_min': 'score_prefactibilidad__gte',
                'score_max': 'score_prefactibilidad__lte',
                'precio_min': 'precio_publicado__gte',
                'precio_max': 'precio_publicado__lte',
                'area_min': 'area_lote__gte',
                'area_max': 'area_lote__lte',
            }[field]
            qs = qs.filter(**{lookup: value})

        return qs

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

    @action(detail=False, methods=['post'])
    def bulk_estado(self, request):
        ids = request.data.get('ids') or []
        estado = request.data.get('estado')

        if not isinstance(ids, list) or not ids:
            return Response({'ids': ['Debes enviar al menos un predio.']}, status=status.HTTP_400_BAD_REQUEST)
        estados_validos = {choice[0] for choice in Predio._meta.get_field('estado').choices}
        if estado not in estados_validos:
            return Response({'estado': ['Estado inválido.']}, status=status.HTTP_400_BAD_REQUEST)

        updated = Predio.objects.filter(id__in=ids).update(estado=estado, ultima_actualizacion=timezone.now())
        return Response({'updated': updated, 'estado': estado})

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        ids = request.data.get('ids') or []

        if not isinstance(ids, list) or not ids:
            return Response({'ids': ['Debes enviar al menos un predio.']}, status=status.HTTP_400_BAD_REQUEST)

        qs = Predio.objects.filter(id__in=ids)
        total = qs.count()
        qs.delete()
        return Response({'deleted': total})

    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        """Agrupa predios por estado para la vista kanban."""
        from apps.scraping.models import ESTADO_PREDIO_CHOICES
        qs = self.filter_queryset(self.get_queryset())
        result = {}
        for estado, label in ESTADO_PREDIO_CHOICES:
            predios = qs.filter(estado=estado)
            result[estado] = {
                'label':   label,
                'count':   predios.count(),
                'predios': PredioListSerializer(predios, many=True).data,
            }
        return Response(result)
