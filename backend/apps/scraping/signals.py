from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='scraping.Predio')
def lanzar_prefactibilidad(sender, instance, created, **kwargs):
    """Al crear un predio nuevo, lanza el cálculo de prefactibilidad en background."""
    if created:
        from apps.scraping.tasks import task_calcular_prefactibilidad
        task_calcular_prefactibilidad.delay(instance.pk)
