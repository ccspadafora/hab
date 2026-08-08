from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='notificaciones', max_retries=3, acks_late=True)
def task_enviar_otp_constructora(self, telefono: str, code: str) -> dict:
    logger.info('otp.constructora.send.start', extra={'telefono': telefono[-4:]})
    try:
        from apps.bot.services.whatsapp_client import WhatsAppClient

        client = WhatsAppClient()
        message = (
            f'🔐 Tu código HAB Constructoras es: *{code}*\n\n'
            f'Válido por 10 minutos.'
        )
        client.send_text(to=telefono, body=message)
        return {'status': 'sent'}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))
