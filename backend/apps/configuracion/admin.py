from django.contrib import admin
from .models import ConfiguracionSistema, ConfiguracionScraping, ConfiguracionIA


@admin.register(ConfiguracionSistema)
class ConfiguracionSistemaAdmin(admin.ModelAdmin):
    list_display  = ('clave', 'valor', 'tipo', 'categoria', 'editable_frontend', 'actualizado_en')
    list_filter   = ('categoria', 'tipo', 'editable_frontend')
    search_fields = ('clave', 'descripcion')
    readonly_fields = ('actualizado_en',)


@admin.register(ConfiguracionScraping)
class ConfiguracionScrapingAdmin(admin.ModelAdmin):
    list_display = ('fuente', 'estrato_min', 'estrato_max', 'frecuencia_cron',
                    'umbral_score_auto_viable', 'umbral_score_auto_noviable')


@admin.register(ConfiguracionIA)
class ConfiguracionIAAdmin(admin.ModelAdmin):
    list_display = ('modelo_estructuracion', 'modelo_bot_whatsapp', 'modelo_scoring',
                    'ia_bot_activa_global', 'escalar_tras_n_mensajes', 'actualizado_en')
    readonly_fields = ('actualizado_en',)
