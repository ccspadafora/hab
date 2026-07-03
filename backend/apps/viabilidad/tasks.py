import json
import logging
import openai
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='analisis', max_retries=2)
def task_analizar_viabilidad_predio(self, analisis_id: int):
    """Calcula índices normativos y proyección financiera para un predio."""
    from apps.viabilidad.models import AnalisisViabilidad
    from apps.scraping.models import ZonaPOT

    try:
        analisis = AnalisisViabilidad.objects.select_related('predio').get(pk=analisis_id)
        predio   = analisis.predio

        zona = ZonaPOT.objects.filter(barrio__icontains=predio.barrio).first()
        if zona:
            ic = float(zona.indice_construccion)
            analisis.zona_pot            = zona.nombre_zona
            analisis.indice_construccion = zona.indice_construccion
            analisis.indice_ocupacion    = zona.indice_ocupacion
            analisis.altura_max_pisos    = zona.altura_max_pisos
            analisis.uso_suelo           = zona.uso_suelo_principal

            area = float(predio.area_lote or 0)
            analisis.area_edificable      = round(area * ic, 2)
            analisis.unidades_proyectadas = max(int(area * ic / 60), 1)

        analisis.completado_en = timezone.now()
        analisis.save()

        task_calcular_score_ia.delay(analisis_id)

        logger.info('viabilidad.analisis.completado', extra={'analisis_id': analisis_id})
    except Exception as exc:
        logger.exception('viabilidad.analisis.error', extra={'analisis_id': analisis_id})
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, queue='ia', max_retries=2, rate_limit='20/m')
def task_calcular_score_ia(self, analisis_id: int):
    """Llama a OpenAI para generar score 0-100 y justificación textual."""
    from apps.viabilidad.models import AnalisisViabilidad

    try:
        analisis = AnalisisViabilidad.objects.select_related('predio').get(pk=analisis_id)

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = (
            f"Analiza la viabilidad de este predio en Bogotá y genera un score del 0 al 100 "
            f"y 3-5 bullets de justificación.\n\n"
            f"Datos del análisis:\n"
            f"- Barrio: {analisis.predio.barrio}\n"
            f"- Área lote: {analisis.predio.area_lote} m²\n"
            f"- Margen estimado: {analisis.margen_estimado}%\n"
            f"- Zona POT: {analisis.zona_pot}\n"
            f"- Índice construcción: {analisis.indice_construccion}\n\n"
            f'Responde en JSON: {{"score": <int>, "justificacion": ["bullet1", "bullet2", ...]}}'
        )
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            response_format={'type': 'json_object'},
            max_tokens=500,
        )
        data = json.loads(response.choices[0].message.content)
        analisis.score_viabilidad = data.get('score')
        analisis.justificacion_ia = '\n'.join(data.get('justificacion', []))
        analisis.save(update_fields=['score_viabilidad', 'justificacion_ia'])

        if analisis.score_viabilidad and analisis.score_viabilidad >= 70:
            analisis.predio.estado = 'viable'
            analisis.predio.save(update_fields=['estado'])

        logger.info(
            'viabilidad.score_ia.completado',
            extra={'analisis_id': analisis_id, 'score': analisis.score_viabilidad},
        )
    except openai.RateLimitError as exc:
        logger.warning('viabilidad.score_ia.rate_limit', extra={'analisis_id': analisis_id})
        raise self.retry(exc=exc, countdown=60)
    except Exception as exc:
        logger.exception('viabilidad.score_ia.error', extra={'analisis_id': analisis_id})
        raise self.retry(exc=exc, countdown=60)
