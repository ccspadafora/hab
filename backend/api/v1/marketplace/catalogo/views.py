from __future__ import annotations

from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.v1.marketplace.auth import get_perfil_from_request
from api.v1.marketplace.publicaciones.serializers import ProyectoCatalogoSerializer
from apps.marketplace.matching.models import Match
from apps.marketplace.publicaciones.models import PublicacionInmueble


class CatalogoProyectosViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Catálogo anónimo / constructora — solo publicaciones visibles."""
    permission_classes = [AllowAny]
    serializer_class = ProyectoCatalogoSerializer

    def get_queryset(self):
        qs = PublicacionInmueble.objects.catalogo()
        params = self.request.query_params

        barrio = params.get('barrio')
        if barrio:
            qs = qs.filter(barrio__icontains=barrio)

        localidad = params.get('localidad')
        if localidad:
            qs = qs.filter(localidad__icontains=localidad)

        estrato = params.get('estrato')
        if estrato is not None and estrato != '':
            try:
                qs = qs.filter(estrato=int(estrato))
            except (TypeError, ValueError):
                pass

        score_min = params.get('score_min')
        if score_min is not None and score_min != '':
            try:
                qs = qs.filter(score_prefactibilidad__gte=float(score_min))
            except (TypeError, ValueError):
                pass

        tipo = params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo)

        return qs

    @action(detail=True, methods=['post'], url_path='interes')
    def interes(self, request, pk=None):
        """Express constructora interest on a catalog project."""
        pub = self.get_object()
        nota = request.data.get('nota', '') or ''
        perfil = get_perfil_from_request(
            request,
            body_perfil_id=request.data.get('perfil_id'),
        )
        if not perfil:
            return Response(
                {'error': 'perfil requerido (Bearer token, X-Perfil-Id o body.perfil_id)'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        match, created = Match.objects.get_or_create(
            publicacion=pub,
            constructora=perfil,
            defaults={
                'origen': 'constructora_interesada',
                'estado': 'interesada',
                'nota_constructora': nota,
                'respondido_en': timezone.now(),
            },
        )
        if not created:
            if match.estado != 'interesada':
                match.estado = 'interesada'
                match.origen = 'constructora_interesada'
                match.nota_constructora = nota or match.nota_constructora
                match.respondido_en = timezone.now()
                match.save(
                    update_fields=[
                        'estado',
                        'origen',
                        'nota_constructora',
                        'respondido_en',
                    ]
                )
            return Response({
                'id': match.id,
                'estado': match.estado,
                'origen': match.origen,
                'created': False,
            })

        return Response(
            {
                'id': match.id,
                'estado': match.estado,
                'origen': match.origen,
                'created': True,
            },
            status=status.HTTP_201_CREATED,
        )
