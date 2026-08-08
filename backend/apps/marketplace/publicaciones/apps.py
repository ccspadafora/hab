from django.apps import AppConfig


class PublicacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.marketplace.publicaciones'
    label = 'marketplace_publicaciones'
    verbose_name = 'Marketplace — Publicaciones'

    def ready(self):
        import apps.marketplace.publicaciones.signals  # noqa: F401
