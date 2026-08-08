from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    queue='notificaciones',
    max_retries=3,
    acks_late=True,
)
def task_enviar_otp_whatsapp(self, telefono: str, code: str) -> dict:
    """
    Sends OTP code via WhatsApp using the existing bot.whatsapp_client.
    Format E.164: +57XXXXXXXXXX
    """
    logger.info('otp.send.start', extra={'telefono': telefono[-4:]})
    try:
        from apps.bot.services.whatsapp_client import WhatsAppClient

        client = WhatsAppClient()
        message = (
            f'🔐 Tu código de verificación de HAB es: *{code}*\n\n'
            f'Válido por 10 minutos. No lo compartas con nadie.'
        )
        client.send_text(to=telefono, body=message)
        logger.info('otp.send.done', extra={'telefono': telefono[-4:]})
        return {'status': 'sent'}
    except Exception as exc:
        logger.exception('otp.send.error', extra={'telefono': telefono[-4:]})
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))


@shared_task(
    bind=True,
    queue='notificaciones',
    max_retries=2,
    acks_late=True,
)
def task_enviar_bienvenida_propietario(self, propietario_id: int) -> dict:
    """Sends welcome WhatsApp after successful registration."""
    from apps.leads.models import Propietario
    from apps.bot.services.whatsapp_client import WhatsAppClient

    try:
        propietario = Propietario.objects.get(pk=propietario_id)
        client = WhatsAppClient()
        nombre = (propietario.nombre or 'propietario').split()[0]
        message = (
            f'¡Hola {nombre}! 👋 Bienvenido a HAB.\n\n'
            f'Aquí te avisaremos de cada novedad de tu inmueble. '
            f'Accede a tu portal: https://portal.hab.com.co/propietarios/inicio'
        )
        phone = propietario.whatsapp_phone or propietario.telefono_principal
        client.send_text(to=phone, body=message)
        return {'status': 'sent', 'propietario_id': propietario_id}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
