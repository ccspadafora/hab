from django.apps import AppConfig


class ViabilidadConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.viabilidad'
    verbose_name = 'Análisis de viabilidad'

    def ready(self):
        import apps.viabilidad.signals  # noqa
