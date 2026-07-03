from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Nota, PipelinePosition
from .serializers import NotaSerializer


class NotaViewSet(viewsets.ModelViewSet):
    """
    ViewSet genérico de notas.
    Se usa desde los routers anidados de cada entidad.
    Requiere kwargs: model (str), pk (int del objeto padre).
    """
    serializer_class   = NotaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        ct = ContentType.objects.get(model=self.kwargs['model'])
        return Nota.objects.filter(
            content_type=ct,
            object_id=self.kwargs['pk'],
        )

    def perform_create(self, serializer):
        ct = ContentType.objects.get(model=self.kwargs['model'])
        serializer.save(
            autor=self.request.user,
            content_type=ct,
            object_id=self.kwargs['pk'],
        )


class PipelineReorderView(APIView):
    """
    PATCH /{model}/pipeline/reorder/
    Body: { items: [{ id, estado, orden }, ...] }
    Actualiza estado + orden en una transacción atómica.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, model_name):
        items      = request.data.get('items', [])
        ct         = get_object_or_404(ContentType, model=model_name)
        ModelClass = ct.model_class()

        for item in items:
            obj = get_object_or_404(ModelClass, pk=item['id'])
            obj.estado = item['estado']
            obj.save(update_fields=['estado', 'updated_at'])
            PipelinePosition.objects.update_or_create(
                content_type=ct,
                object_id=obj.pk,
                defaults={'orden': item['orden']},
            )
        return Response({'status': 'ok'})
