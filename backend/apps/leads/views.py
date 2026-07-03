from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Propietario, Lead, InteraccionLead, Cita
from .serializers import (
    PropietarioSerializer,
    LeadSerializer,
    LeadDetalleSerializer,
    InteraccionLeadSerializer,
    CitaSerializer,
)
from shared.permissions import IsAdminOrAsesor


class PropietarioViewSet(viewsets.ModelViewSet):
    queryset = Propietario.objects.select_related('asesor_asignado').all()
    serializer_class   = PropietarioSerializer
    permission_classes = [IsAuthenticated, IsAdminOrAsesor]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['estado_contacto', 'temperatura', 'tipo']
    search_fields      = ['nombre', 'cedula_nit', 'telefono_principal', 'whatsapp_phone']
    ordering_fields    = ['created_at', 'ultimo_contacto', 'nombre']

    @action(detail=True, methods=['get'])
    def predios(self, request, pk=None):
        """Devuelve predios asociados al propietario."""
        propietario = self.get_object()
        from apps.scraping.serializers import PredioListSerializer
        return Response(PredioListSerializer(propietario.predios.all(), many=True).data)


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('asesor', 'predio', 'propietario').all()
    permission_classes = [IsAuthenticated, IsAdminOrAsesor]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['estado', 'temperatura', 'asesor']
    search_fields      = ['nombre', 'telefono', 'email']
    ordering_fields    = ['created_at', 'ultimo_contacto', 'proxima_accion']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LeadDetalleSerializer
        return LeadSerializer

    def perform_create(self, serializer):
        serializer.save(asesor=self.request.user)

    @action(detail=True, methods=['post'])
    def interaccion(self, request, pk=None):
        lead = self.get_object()
        serializer = InteraccionLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(lead=lead, usuario=request.user)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def cita(self, request, pk=None):
        lead = self.get_object()
        serializer = CitaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(lead=lead, asesor=request.user)
        return Response(serializer.data, status=201)
