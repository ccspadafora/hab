from __future__ import annotations

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.marketplace.matching.models import Match
from apps.marketplace.negociaciones.models import Negociacion
from apps.marketplace.perfiles_constructora.models import (
    PerfilConstructoraMP,
    SolicitudCertificacionConstructora,
)
from apps.marketplace.publicaciones.models import PublicacionInmueble


class AdminMarketplaceDashboardView(APIView):
    """Stub dashboard metrics for HAB internal marketplace ops."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'publicaciones': {
                'total': PublicacionInmueble.objects.count(),
                'en_revision': PublicacionInmueble.objects.filter(estado='en_revision').count(),
                'activas': PublicacionInmueble.objects.filter(estado='activa').count(),
            },
            'solicitudes_pendientes': SolicitudCertificacionConstructora.objects.filter(
                estado__in=['recibida', 'en_revision']
            ).count(),
            'perfiles_certificados': PerfilConstructoraMP.objects.filter(
                estado_certificacion='certificada'
            ).count(),
            'matches': Match.objects.count(),
            'negociaciones_abiertas': Negociacion.objects.exclude(
                fase__in=['cerrada_exitosa', 'cerrada_sin_exito']
            ).count(),
        })


class AdminPublicacionesPendientesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = PublicacionInmueble.objects.filter(estado='en_revision').order_by('-created_at')[:50]
        return Response({
            'count': qs.count(),
            'results': [
                {
                    'id': p.id,
                    'barrio': p.barrio,
                    'tipo': p.tipo,
                    'score_prefactibilidad': p.score_prefactibilidad,
                    'identidad_verificada': p.identidad_verificada,
                    'propiedad_verificada': p.propiedad_verificada,
                    'created_at': p.created_at,
                }
                for p in qs
            ],
        })


class AdminSolicitudesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = SolicitudCertificacionConstructora.objects.all().order_by('-created_at')[:50]
        return Response({
            'count': qs.count(),
            'results': [
                {
                    'id': s.id,
                    'nombre_empresa': s.nombre_empresa,
                    'nit': s.nit,
                    'estado': s.estado,
                    'created_at': s.created_at,
                }
                for s in qs
            ],
        })
