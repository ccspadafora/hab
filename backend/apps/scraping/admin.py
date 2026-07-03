from django.contrib import admin
from .models import FuenteScraping, ZonaPOT, Predio, EjecucionScraping


@admin.register(FuenteScraping)
class FuenteScrapingAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'url_base', 'activo', 'ultima_ejecucion')
    list_filter   = ('activo',)
    search_fields = ('nombre',)


@admin.register(ZonaPOT)
class ZonaPOTAdmin(admin.ModelAdmin):
    list_display  = ('nombre_zona', 'barrio', 'localidad', 'indice_construccion', 'es_zona_densificacion')
    list_filter   = ('localidad', 'es_zona_densificacion')
    search_fields = ('nombre_zona', 'barrio', 'localidad')


@admin.register(Predio)
class PredioAdmin(admin.ModelAdmin):
    list_display  = ('direccion', 'barrio', 'tipo', 'estrato', 'precio_publicado',
                     'estado', 'score_prefactibilidad', 'primera_deteccion')
    list_filter   = ('estado', 'tipo', 'estrato')
    search_fields = ('barrio', 'localidad', 'direccion', 'codigo_externo')
    readonly_fields = ('score_prefactibilidad', 'tags', 'metricas_prefact',
                       'detalle_scores', 'prefact_calculada_en')


@admin.register(EjecucionScraping)
class EjecucionScrapingAdmin(admin.ModelAdmin):
    list_display = ('fuente', 'inicio', 'fin', 'estado', 'predios_nuevos', 'errores')
    list_filter  = ('estado', 'fuente')
