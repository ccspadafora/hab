from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='viabilidad.AnalisisViabilidad')
def lanzar_analisis_viabilidad(sender, instance, created, **kwargs):
    """Al crear un análisis, lanza el cálculo POT + métricas en background."""
    if created:
        from apps.viabilidad.tasks import task_analizar_viabilidad_predio
        task_analizar_viabilidad_predio.delay(instance.pk)
