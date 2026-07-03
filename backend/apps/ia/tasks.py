import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue='ia', max_retries=2)
def task_generar_estructuracion_ia(self, proyecto_id: int):
    """Genera la estructuración financiera de un proyecto usando IA."""
    from apps.ia.services.estructuracion_service import EstructuracionIAService
    from apps.proyectos.models import EstructuracionProyecto, Proyecto

    try:
        service = EstructuracionIAService(proyecto_id)
        datos   = service.generar()

        with transaction.atomic():
            EstructuracionProyecto.objects.filter(
                proyecto_id=proyecto_id, es_vigente=True
            ).update(es_vigente=False)

            version = EstructuracionProyecto.objects.filter(
                proyecto_id=proyecto_id
            ).count() + 1

            EstructuracionProyecto.objects.create(
                proyecto_id=proyecto_id,
                version=version,
                es_vigente=True,
                generada_por_ia=True,
                **datos,
            )

        Proyecto.objects.filter(pk=proyecto_id).update(
            estructuracion_generada_en=timezone.now()
        )
        logger.info(
            'ia.estructuracion.generada',
            extra={'proyecto_id': proyecto_id, 'version': version},
        )

    except Exception as exc:
        logger.exception('ia.estructuracion.error', extra={'proyecto_id': proyecto_id})
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, queue='documentos', max_retries=2)
def task_extraer_texto_documento(self, documento_id: int):
    """Extrae texto de un documento subido (PDF, DOCX) y lo persiste."""
    from apps.ia.models import BaseConocimientoIA

    try:
        doc = BaseConocimientoIA.objects.get(pk=documento_id)
        if not doc.archivo:
            return

        texto        = ''
        archivo_tipo = doc.archivo_tipo.lower()

        if archivo_tipo == 'pdf':
            import fitz  # pymupdf
            with fitz.open(doc.archivo.path) as pdf:
                texto = '\n'.join(page.get_text() for page in pdf)
        elif archivo_tipo == 'docx':
            from docx import Document
            document = Document(doc.archivo.path)
            texto = '\n'.join(p.text for p in document.paragraphs)

        doc.contenido_extraido = texto
        doc.save(update_fields=['contenido_extraido'])
        logger.info(
            'ia.documento.texto_extraido',
            extra={'documento_id': documento_id, 'chars': len(texto)},
        )

    except Exception as exc:
        logger.exception('ia.documento.extraccion_error', extra={'documento_id': documento_id})
        raise self.retry(exc=exc, countdown=60)
