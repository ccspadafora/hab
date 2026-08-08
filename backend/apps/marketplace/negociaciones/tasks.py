from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='notificaciones', acks_late=True)
def task_notif_cambio_fase(self, negociacion_id: int, fase: str) -> dict:
    logger.info(
        'negociacion.fase.notify',
        extra={'negociacion_id': negociacion_id, 'fase': fase},
    )
    return {'negociacion_id': negociacion_id, 'fase': fase}
