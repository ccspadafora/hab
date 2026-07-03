from django.contrib import admin
from .models import Nota, PipelinePosition


@admin.register(Nota)
class NotaAdmin(admin.ModelAdmin):
    list_display  = ('tipo', 'content_type', 'object_id', 'autor', 'es_fijada', 'creada_en')
    list_filter   = ('tipo', 'es_fijada', 'content_type')
    search_fields = ('texto',)
    readonly_fields = ('creada_en', 'actualizada_en')


@admin.register(PipelinePosition)
class PipelinePositionAdmin(admin.ModelAdmin):
    list_display = ('content_type', 'object_id', 'orden')
    list_filter  = ('content_type',)
