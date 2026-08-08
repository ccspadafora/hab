from django.contrib import admin

from .models import EstructuracionExpress, PublicacionInmueble


@admin.register(PublicacionInmueble)
class PublicacionInmuebleAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'barrio', 'tipo', 'estrato', 'estado',
        'score_prefactibilidad', 'visible_constructoras', 'publicado_en',
    )
    list_filter = ('estado', 'tipo', 'estrato', 'visible_constructoras', 'ciudad')
    search_fields = ('titulo', 'direccion', 'barrio', 'localidad', 'propietario__nombre')
    readonly_fields = (
        'score_prefactibilidad', 'tags_prefact', 'metricas_prefact',
        'prefact_calculada_en', 'created_at', 'updated_at',
    )
    raw_id_fields = ('propietario', 'verificado_por', 'predio_vinculado', 'proyecto_generado')


@admin.register(EstructuracionExpress)
class EstructuracionExpressAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'publicacion', 'unidades_proyectadas', 'roi_est',
        'margen_bruto_est', 'generated_at',
    )
    raw_id_fields = ('publicacion',)
    readonly_fields = ('generated_at', 'updated_at')
