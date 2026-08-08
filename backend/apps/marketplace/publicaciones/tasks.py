from __future__ import annotations

import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    queue='analisis',
    max_retries=3,
    acks_late=True,
)
def task_prefact_publicacion(self, publicacion_id: int) -> dict:
    """
    Runs PrefactibilidadEngine on a PublicacionInmueble.
    Reuses the existing engine from apps.scraping via PublicacionPrefactService.
    """
    from apps.marketplace.publicaciones.models import PublicacionInmueble
    from apps.marketplace.publicaciones.services.publicacion_service import (
        PublicacionPrefactService,
    )

    logger.info('prefact_publicacion.start', extra={'id': publicacion_id})
    try:
        pub = PublicacionInmueble.objects.get(pk=publicacion_id)
        service = PublicacionPrefactService()
        result = service.calcular(pub)

        with transaction.atomic():
            PublicacionInmueble.objects.filter(pk=publicacion_id).update(
                score_prefactibilidad=result.score,
                tags_prefact=result.tags,
                metricas_prefact=result.metricas,
                prefact_calculada_en=timezone.now(),
                estado='rechazada' if result.score < 30 else pub.estado,
            )

        if result.score < 30:
            task_notif_prefact_baja.delay(publicacion_id)
        else:
            task_notif_prefact_alta.delay(publicacion_id, result.score)

        logger.info(
            'prefact_publicacion.done',
            extra={'id': publicacion_id, 'score': result.score},
        )
        return {'id': publicacion_id, 'score': result.score}

    except PublicacionInmueble.DoesNotExist:
        logger.error('prefact_publicacion.not_found', extra={'id': publicacion_id})
        raise
    except Exception as exc:
        logger.exception('prefact_publicacion.error', extra={'id': publicacion_id})
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(
    bind=True,
    queue='ia',
    max_retries=2,
    acks_late=True,
    rate_limit='10/m',
)
def task_estructuracion_express(self, publicacion_id: int) -> dict:
    """
    Generates EstructuracionExpress using EstructuracionExpressService adapter.
    Runs after prefactibilidad confirms viability.
    """
    from apps.marketplace.publicaciones.models import (
        EstructuracionExpress,
        PublicacionInmueble,
    )
    from apps.ia.services.estructuracion_service import EstructuracionExpressService

    logger.info('estructuracion_express.start', extra={'id': publicacion_id})
    try:
        pub = PublicacionInmueble.objects.select_related('predio_vinculado').get(
            pk=publicacion_id
        )
        service = EstructuracionExpressService(publicacion=pub)
        datos = service.generar()

        with transaction.atomic():
            EstructuracionExpress.objects.update_or_create(
                publicacion=pub,
                defaults=datos,
            )
            PublicacionInmueble.objects.filter(pk=publicacion_id).update(
                estado='activa',
                visible_constructoras=True,
                publicado_en=timezone.now(),
            )

        task_run_matching.delay(publicacion_id)
        logger.info('estructuracion_express.done', extra={'id': publicacion_id})
        return {'id': publicacion_id, 'status': 'ok'}

    except Exception as exc:
        logger.exception('estructuracion_express.error', extra={'id': publicacion_id})
        raise self.retry(exc=exc, countdown=120 * (2 ** self.request.retries))


@shared_task(bind=True, queue='analisis', max_retries=2, acks_late=True)
def task_run_matching(self, publicacion_id: int) -> dict:
    """
    Runs MatchingEngine when a publication becomes active.
    Creates Match records for compatible constructoras.
    """
    from apps.marketplace.matching.services.matching_engine import MatchingEngine

    logger.info('matching.start', extra={'publicacion_id': publicacion_id})
    try:
        engine = MatchingEngine()
        matches = engine.run(publicacion_id)
        task_notificar_constructoras_match.apply_async(
            args=[publicacion_id, [m.id for m in matches]],
            countdown=2 * 3600,
        )
        logger.info(
            'matching.done',
            extra={'publicacion_id': publicacion_id, 'matches': len(matches)},
        )
        return {'publicacion_id': publicacion_id, 'matches_created': len(matches)}
    except Exception as exc:
        logger.exception('matching.error', extra={'publicacion_id': publicacion_id})
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, queue='notificaciones', max_retries=2, acks_late=True)
def task_notificar_constructoras_match(
    self, publicacion_id: int, match_ids: list[int]
) -> dict:
    """Sends notifications to matched constructoras after 2h HAB review window."""
    from apps.marketplace.matching.models import Match
    from apps.bot.services.whatsapp_client import WhatsAppClient

    matches = Match.objects.filter(
        id__in=match_ids,
        estado='sugerido',
    ).select_related('constructora__constructora', 'publicacion')

    client = WhatsAppClient()
    notified = 0
    for match in matches:
        try:
            constructora = match.constructora
            phone = constructora.constructora.contact_phone
            message = (
                f'🏗️ Nuevo proyecto disponible en HAB Marketplace.\n\n'
                f'Barrio: {match.publicacion.barrio}\n'
                f'Área: {match.publicacion.area_lote}m² de lote\n\n'
                f'Ver detalle: https://portal.hab.com.co/constructoras/catalogo/{match.publicacion_id}'
            )
            client.send_text(to=phone, body=message)
            match.estado = 'notificado'
            match.notificado_en = timezone.now()
            match.save(update_fields=['estado', 'notificado_en'])
            notified += 1
        except Exception as e:
            logger.error(
                'match.notify.error',
                extra={'match_id': match.id, 'error': str(e)},
            )

    return {'notified': notified}


@shared_task(bind=True, queue='notificaciones', acks_late=True)
def task_notif_prefact_baja(self, publicacion_id: int) -> None:
    """Notifies propietario that property doesn't qualify."""
    from apps.marketplace.publicaciones.models import PublicacionInmueble
    from apps.bot.services.whatsapp_client import WhatsAppClient

    pub = PublicacionInmueble.objects.select_related('propietario').get(pk=publicacion_id)
    client = WhatsAppClient()
    nombre = (pub.propietario.nombre or 'propietario').split()[0]
    message = (
        f'📋 Hola {nombre}, revisamos tu inmueble en {pub.barrio}.\n\n'
        f'En este momento no cumple los criterios para un proyecto inmobiliario con HAB. '
        f'¿Tienes preguntas? Escríbenos aquí mismo.'
    )
    phone = pub.propietario.whatsapp_phone or pub.propietario.telefono_principal
    client.send_text(to=phone, body=message)


@shared_task(bind=True, queue='notificaciones', acks_late=True)
def task_notif_prefact_alta(self, publicacion_id: int, score: float) -> None:
    """Notifies propietario that property has good potential."""
    from apps.marketplace.publicaciones.models import PublicacionInmueble
    from apps.bot.services.whatsapp_client import WhatsAppClient

    pub = PublicacionInmueble.objects.select_related('propietario').get(pk=publicacion_id)
    nivel = 'alto' if score >= 66 else 'medio'
    client = WhatsAppClient()
    nombre = (pub.propietario.nombre or 'propietario').split()[0]
    message = (
        f'📊 ¡Buenas noticias, {nombre}! '
        f'Tu inmueble en {pub.barrio} tiene potencial {nivel} para un proyecto.\n\n'
        f'El siguiente paso es verificar tu identidad. '
        f'Ingresa a tu portal: https://portal.hab.com.co/propietarios/mis-inmuebles/{publicacion_id}'
    )
    phone = pub.propietario.whatsapp_phone or pub.propietario.telefono_principal
    client.send_text(to=phone, body=message)
