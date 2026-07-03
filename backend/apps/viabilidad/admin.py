from django.contrib import admin
from .models import AnalisisViabilidad


@admin.register(AnalisisViabilidad)
class AnalisisViabilidadAdmin(admin.ModelAdmin):
    list_display  = ('predio', 'analista', 'es_viable', 'score_viabilidad',
                     'margen_estimado', 'solicitado_en', 'completado_en')
    list_filter   = ('es_viable',)
    search_fields = ('predio__barrio', 'predio__direccion')
    readonly_fields = ('solicitado_en', 'completado_en', 'score_viabilidad', 'justificacion_ia')
