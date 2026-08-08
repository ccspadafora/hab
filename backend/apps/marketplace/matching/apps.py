from django.apps import AppConfig


class MatchingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.marketplace.matching'
    label = 'marketplace_matching'
    verbose_name = 'Marketplace — Matching'
