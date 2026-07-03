import hashlib
import hmac
import logging

from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Conversacion, Mensaje
from .serializers import (
    ConversacionListSerializer,
    ConversacionDetalleSerializer,
    MensajeSerializer,
)

logger = logging.getLogger(__name__)


class ConversacionViewSet(viewsets.ReadOnlyModelViewSet):
    """Inbox de conversaciones WhatsApp."""
    queryset = Conversacion.objects.select_related(
        'propietario', 'asignado_a', 'ia_desactivada_por'
    ).prefetch_related('mensajes').all()
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['estado', 'ia_activa', 'etapa_bot', 'asignado_a']
    search_fields      = ['wa_contact_phone', 'propietario__nombre']
    ordering_fields    = ['ultimo_mensaje', 'iniciado_en']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversacionDetalleSerializer
        return ConversacionListSerializer

    @action(detail=True, methods=['post'])
    def tomar_control(self, request, pk=None):
        """El agente desactiva la IA y toma el chat manualmente."""
        conv = self.get_object()
        motivo = request.data.get('motivo', '')
        conv.ia_activa           = False
        conv.ia_desactivada_por  = request.user
        conv.ia_desactivada_en   = timezone.now()
        conv.motivo_desactivacion = motivo
        conv.asignado_a          = request.user
        conv.save(update_fields=[
            'ia_activa', 'ia_desactivada_por',
            'ia_desactivada_en', 'motivo_desactivacion', 'asignado_a',
        ])
        logger.warning(
            'bot.ia.desactivada',
            extra={'conversacion_id': conv.pk, 'usuario': request.user.pk, 'motivo': motivo},
        )
        return Response({'status': 'control tomado', 'ia_activa': False})

    @action(detail=True, methods=['post'])
    def ceder_control(self, request, pk=None):
        """El agente devuelve el chat a la IA."""
        conv = self.get_object()
        conv.ia_activa          = True
        conv.ia_desactivada_por = None
        conv.ia_desactivada_en  = None
        conv.asignado_a         = None
        conv.save(update_fields=[
            'ia_activa', 'ia_desactivada_por', 'ia_desactivada_en', 'asignado_a',
        ])
        return Response({'status': 'control cedido a IA', 'ia_activa': True})

    @action(detail=True, methods=['post'])
    def enviar_mensaje(self, request, pk=None):
        """Envía un mensaje manual desde el agente (saliente, no IA)."""
        conv    = self.get_object()
        texto   = request.data.get('texto', '').strip()
        if not texto:
            return Response({'error': 'texto requerido'}, status=status.HTTP_400_BAD_REQUEST)

        import uuid
        mensaje = Mensaje.objects.create(
            conversacion=conv,
            wa_message_id=f'manual_{uuid.uuid4().hex}',
            direccion='saliente',
            tipo='texto',
            contenido=texto,
            generado_por_ia=False,
            enviado_en=timezone.now(),
        )
        conv.ultimo_mensaje = timezone.now()
        conv.save(update_fields=['ultimo_mensaje'])

        # TODO: enviar a Meta API
        return Response(MensajeSerializer(mensaje).data, status=status.HTTP_201_CREATED)


class WhatsAppWebhookView(APIView):
    """
    Webhook de Meta WhatsApp.
    GET: verificación del hub.
    POST: mensajes entrantes — delega a Celery inmediatamente.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        mode      = request.query_params.get('hub.mode')
        token     = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        if mode != 'subscribe' or token != settings.META_WEBHOOK_VERIFY_TOKEN:
            return Response(status=403)
        return Response(int(challenge), status=200)

    def post(self, request):
        if not self._verify_hmac(request):
            logger.error(
                'bot.webhook.hmac_invalid',
                extra={'remote_ip': request.META.get('REMOTE_ADDR')},
            )
            return Response({'error': 'Invalid signature'}, status=403)

        from apps.bot.tasks import task_procesar_mensaje_entrante
        task_procesar_mensaje_entrante.delay(request.data)
        return Response({'status': 'received'}, status=200)

    def _verify_hmac(self, request) -> bool:
        if not settings.META_APP_SECRET:
            logger.error('bot.webhook.missing_app_secret')
            return False

        header = request.META.get('HTTP_X_HUB_SIGNATURE_256', '')
        if not header.startswith('sha256='):
            return False
        expected = hmac.new(
            settings.META_APP_SECRET.encode(),
            request.body,
            hashlib.sha256,
        ).hexdigest()
        received = header[7:]
        return hmac.compare_digest(expected, received)
