from django.contrib import admin
from .models import BaseConocimientoIA, PromptIA


@admin.register(BaseConocimientoIA)
class BaseConocimientoIAAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'tipo', 'aplica_a', 'activo', 'creado_por', 'creado_en')
    list_filter   = ('tipo', 'aplica_a', 'activo')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('creado_en', 'actualizado_en', 'contenido_extraido')


@admin.register(PromptIA)
class PromptIAAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'modulo', 'version', 'activo', 'actualizado_en')
    list_filter   = ('modulo', 'activo')
    search_fields = ('nombre',)
    readonly_fields = ('version', 'actualizado_en')
