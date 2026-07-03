from django.apps import AppConfig


class LeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.leads'
    verbose_name = 'CRM — Leads y Propietarios'

    def ready(self):
        import apps.leads.signals  # noqa
