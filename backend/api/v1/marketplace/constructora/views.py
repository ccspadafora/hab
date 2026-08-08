from __future__ import annotations

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.marketplace.matching.models import Match
from django.utils import timezone


class ConstructoraMatchViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    queryset = Match.objects.select_related('publicacion', 'constructora').all()

    def get_queryset(self):
        qs = Match.objects.select_related('publicacion', 'constructora').order_by('-created_at')
        perfil_id = self.request.headers.get('X-Perfil-Id') or self.request.query_params.get(
            'perfil_id'
        )
        if self.action == 'list' and not perfil_id:
            return qs.none()
        if perfil_id:
            qs = qs.filter(constructora_id=perfil_id)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()[:50]
        data = [
            {
                'id': m.id,
                'publicacion_id': m.publicacion_id,
                'score_match': m.score_match,
                'estado': m.estado,
                'origen': m.origen,
                'barrio': m.publicacion.barrio,
                'created_at': m.created_at,
            }
            for m in qs
        ]
        return Response({'count': len(data), 'results': data})

    @action(detail=True, methods=['post'])
    def interes(self, request, pk=None):
        match = self.get_object()
        match.estado = 'interesada'
        match.nota_constructora = request.data.get('nota', '')
        match.respondido_en = timezone.now()
        match.save(update_fields=['estado', 'nota_constructora', 'respondido_en'])
        return Response({'id': match.id, 'estado': match.estado})


class ConstructoraPerfilView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'perfil': None, 'detail': 'stub — sin sesión'})
