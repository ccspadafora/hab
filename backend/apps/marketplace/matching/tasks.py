from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='analisis', acks_late=True)
def task_matching_placeholder(self, publicacion_id: int) -> dict:
    """Placeholder — matching is triggered from publicaciones.tasks."""
    logger.info('matching.placeholder', extra={'publicacion_id': publicacion_id})
    return {'publicacion_id': publicacion_id}
