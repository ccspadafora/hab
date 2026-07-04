import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='analisis', max_retries=2)
def task_calcular_prefactibilidad(self, predio_id: int):
    """
    Calcula el score de prefactibilidad de un predio.
    Se dispara desde el signal post_save de Predio.
    """
    from apps.scraping.models import Predio
    from apps.scraping.services.prefactibilidad import PrefactibilidadEngine

    try:
        predio = Predio.objects.get(pk=predio_id)
        engine = PrefactibilidadEngine()
        result = engine.calcular(predio)

        estado = _determinar_estado_auto(result.score)

        Predio.objects.filter(pk=predio_id).update(
            score_prefactibilidad=result.score,
            tags=result.tags,
            metricas_prefact=result.metricas,
            detalle_scores=result.detalle_scores,
            prefact_calculada_en=timezone.now(),
            estado=estado,
        )
        logger.info(
            'prefactibilidad.calculada',
            extra={'predio_id': predio_id, 'score': result.score},
        )
    except Exception as exc:
        logger.exception('prefactibilidad.error', extra={'predio_id': predio_id})
        raise self.retry(exc=exc, countdown=60)


def _determinar_estado_auto(score: float) -> str:
    """Determina estado automático según el score. Umbrales configurables vía ConfiguracionScraping."""
    if score >= 70:
        return 'viable_negociacion'
    if score <= 25:
        return 'descartado'
    return 'para_estudio'


@shared_task(bind=True, queue='scraping', max_retries=3)
def task_ejecutar_scraping_fuente(self, fuente_id: int):
    """
    Ejecuta el scraping de una fuente específica.
    Programado por Celery Beat según la frecuencia configurada.
    """
    from apps.scraping.models import FuenteScraping, EjecucionScraping

    try:
        fuente = FuenteScraping.objects.get(pk=fuente_id, activo=True)
        ejecucion = EjecucionScraping.objects.create(
            fuente=fuente,
            inicio=timezone.now(),
            estado='corriendo',
        )
        logger.info('scraping.inicio', extra={'fuente': fuente.nombre})

        # TODO: Implementar scraper específico por fuente
        # scraper = get_scraper(fuente)
        # predios_encontrados, predios_nuevos = scraper.ejecutar()

        ejecucion.fin    = timezone.now()
        ejecucion.estado = 'exitoso'
        ejecucion.save()

        fuente.ultima_ejecucion = timezone.now()
        fuente.save(update_fields=['ultima_ejecucion'])

        logger.info('scraping.done', extra={'fuente': fuente.nombre})

    except Exception as exc:
        logger.exception('scraping.error', extra={'fuente_id': fuente_id})
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 60)
