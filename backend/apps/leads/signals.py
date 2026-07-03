from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender='leads.Propietario')
def crear_lead_automatico(sender, instance, created, **kwargs):
    """
    Al crear un Propietario, genera automáticamente un Lead en el CRM
    para iniciar el seguimiento comercial.
    """
    if not created:
        return

    from apps.leads.models import Lead
    # Evitar duplicados si ya existe un lead con ese teléfono
    if Lead.objects.filter(telefono=instance.telefono_principal).exists():
        logger.info(f'Lead ya existe para {instance.telefono_principal}, no se crea duplicado')
        return

    lead = Lead.objects.create(
        nombre=instance.nombre,
        telefono=instance.telefono_principal,
        email=instance.email or '',
        propietario=instance,
        asesor=instance.asesor_asignado,
        estado='nuevo',
        temperatura=instance.temperatura,
        fuente_origen=instance.fuente_origen or 'panel',
        etiquetas=instance.etiquetas or [],
    )
    logger.info(f'Lead creado automáticamente #{lead.id} para propietario {instance.nombre}')
