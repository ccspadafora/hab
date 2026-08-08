from __future__ import annotations

from django.db.models import Avg, Count, Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.marketplace.auth import get_propietario_from_request
from api.v1.marketplace.publicaciones.serializers import (
    PublicacionCreateSerializer,
    PublicacionListSerializer,
    PublicacionUpdateSerializer,
)
from apps.marketplace.publicaciones.models import PublicacionInmueble


class PropietarioPublicacionViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Portal propietario: list/create/update publications.
    Auth: Bearer propietario token or X-Propietario-Id (dev fallback).
    """
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    queryset = PublicacionInmueble.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return PublicacionCreateSerializer
        if self.action in ('partial_update', 'update'):
            return PublicacionUpdateSerializer
        return PublicacionListSerializer

    def get_queryset(self):
        propietario = get_propietario_from_request(self.request)
        if not propietario:
            return PublicacionInmueble.objects.none()
        return PublicacionInmueble.objects.filter(
            propietario=propietario,
        ).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        propietario = get_propietario_from_request(request)
        if not propietario:
            # Fallback: body propietario_id for transitional clients
            propietario_id = request.data.get('propietario_id')
            if propietario_id:
                from apps.leads.models import Propietario

                try:
                    propietario = Propietario.objects.get(pk=propietario_id)
                except Propietario.DoesNotExist:
                    propietario = None
        if not propietario:
            return Response(
                {'error': 'Autenticación requerida (Bearer token o X-Propietario-Id)'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'propietario': propietario},
        )
        serializer.is_valid(raise_exception=True)
        pub = serializer.save()
        return Response(
            PublicacionListSerializer(pub).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        pub = self.get_object()
        if pub.estado != 'borrador':
            return Response(
                {'error': 'Solo se pueden editar publicaciones en borrador'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(pub, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        pub = serializer.save()
        return Response(PublicacionListSerializer(pub).data)

    @action(detail=True, methods=['post'])
    def enviar_revision(self, request, pk=None):
        pub = self.get_object()
        if pub.estado != 'borrador':
            return Response(
                {'error': 'Solo borradores pueden enviarse a revisión'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pub.estado = 'en_revision'
        pub.save(update_fields=['estado', 'updated_at'])
        return Response(PublicacionListSerializer(pub).data)


class PropietarioDashboardView(APIView):
    """Stub dashboard with publication counts for the authenticated propietario."""
    permission_classes = [AllowAny]

    def get(self, request):
        propietario = get_propietario_from_request(request)
        if not propietario:
            return Response(
                {'error': 'Autenticación requerida (Bearer token o X-Propietario-Id)'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        qs = PublicacionInmueble.objects.filter(propietario=propietario)
        agg = qs.aggregate(
            total=Count('id'),
            activas=Count('id', filter=Q(estado='activa')),
            en_revision=Count('id', filter=Q(estado='en_revision')),
            borradores=Count('id', filter=Q(estado='borrador')),
            score_promedio=Avg('score_prefactibilidad'),
        )
        score = agg['score_promedio']
        return Response({
            'propietario_id': propietario.pk,
            'total_publicaciones': agg['total'] or 0,
            'activas': agg['activas'] or 0,
            'en_revision': agg['en_revision'] or 0,
            'borradores': agg['borradores'] or 0,
            'score_promedio': float(score) if score is not None else None,
        })
