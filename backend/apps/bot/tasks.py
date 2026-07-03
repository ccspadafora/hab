import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='bot', max_retries=3)
def task_procesar_mensaje_entrante(self, payload: dict):
    """
    Procesa un mensaje entrante de WhatsApp.
    Extrae el número, vincula con Propietario,
    crea/recupera Conversacion y persiste el Mensaje.
    """
    from apps.bot.models import Conversacion, Mensaje
    from apps.bot.services.conversation_linker import ConversationLinker

    try:
        entry   = payload.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0].get('value', {})
        wa_phone_id = changes.get('metadata', {}).get('phone_number_id', '')
        messages    = changes.get('messages', [])

        if not messages:
            return

        msg         = messages[0]
        wa_phone    = msg.get('from', '')
        wa_msg_id   = msg.get('id', '')
        texto       = msg.get('text', {}).get('body', '')
        timestamp   = msg.get('timestamp', '')

        if not wa_phone or not wa_msg_id:
            logger.warning('bot.webhook.mensaje_invalido', extra={'payload': payload})
            return

        propietario, _ = ConversationLinker.vincular_o_crear(wa_phone)

        conv, _ = Conversacion.objects.get_or_create(
            wa_contact_phone=wa_phone,
            estado__in=['activa', 'pausada'],
            defaults={
                'wa_phone_id': wa_phone_id,
                'propietario': propietario,
            },
        )

        enviado_en = timezone.datetime.fromtimestamp(
            int(timestamp), tz=timezone.get_current_timezone()
        ) if timestamp else timezone.now()

        Mensaje.objects.get_or_create(
            wa_message_id=wa_msg_id,
            defaults={
                'conversacion':    conv,
                'direccion':       'entrante',
                'tipo':            'texto',
                'contenido':       texto,
                'generado_por_ia': False,
                'enviado_en':      enviado_en,
                'metadata':        msg,
            },
        )

        conv.ultimo_mensaje = timezone.now()
        conv.save(update_fields=['ultimo_mensaje'])

        logger.info(
            'bot.mensaje.recibido',
            extra={'wa_phone': wa_phone, 'conversacion_id': conv.pk},
        )

        if conv.ia_activa:
            task_generar_respuesta_ia.delay(conv.pk, texto)

    except Exception as exc:
        logger.exception('bot.mensaje.error')
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, queue='bot', max_retries=2)
def task_generar_respuesta_ia(self, conversacion_id: int, mensaje_texto: str):
    """
    Genera una respuesta con IA y la encola para envío.
    Stub — implementación completa en Fase 7 (IA + prompts).
    """
    logger.info(
        'bot.respuesta_ia.encolada',
        extra={'conversacion_id': conversacion_id},
    )
    # TODO: integrar con PromptIA y OpenAI en Fase 8
