from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='notificaciones', acks_late=True)
def task_notif_certificacion(self, perfil_id: int, aprobada: bool) -> dict:
    logger.info(
        'certificacion.notify',
        extra={'perfil_id': perfil_id, 'aprobada': aprobada},
    )
    return {'perfil_id': perfil_id, 'aprobada': aprobada}
