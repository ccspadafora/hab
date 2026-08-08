from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='marketplace_publicaciones.PublicacionInmueble')
def on_publicacion_estado_cambia(
    sender, instance, created: bool, **kwargs
) -> None:
    """
    Dispatches tasks based on state transitions.
    Signal must NOT contain business logic — only task dispatch.
    """
    if created:
        return

    if instance.estado == 'en_revision' and not instance.score_prefactibilidad:
        from apps.marketplace.publicaciones.tasks import task_prefact_publicacion
        task_prefact_publicacion.delay(instance.pk)

    if (
        instance.esta_verificada
        and instance.score_prefactibilidad
        and float(instance.score_prefactibilidad) >= 30
        and instance.estado == 'en_revision'
    ):
        from apps.marketplace.publicaciones.tasks import task_estructuracion_express
        task_estructuracion_express.delay(instance.pk)
