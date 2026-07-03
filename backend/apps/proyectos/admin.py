from django.contrib import admin
from .models import Proyecto, ProyectoPropietario, HitoProyecto, EstructuracionProyecto


class HitoProyectoInline(admin.TabularInline):
    model  = HitoProyecto
    extra  = 0
    fields = ('tipo', 'fecha_planeada', 'fecha_real', 'completado')


class ProyectoPropietarioInline(admin.TabularInline):
    model  = ProyectoPropietario
    extra  = 0
    fields = ('propietario', 'porcentaje_aporte', 'firmado', 'fecha_firma')


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display  = ('codigo', 'nombre', 'fase', 'gerente',
                     'valor_total_estimado', 'estructuracion_generada_en', 'created_at')
    list_filter   = ('fase',)
    search_fields = ('nombre', 'codigo', 'slug')
    prepopulated_fields = {'slug': ('nombre',)}
    inlines       = [ProyectoPropietarioInline, HitoProyectoInline]


@admin.register(EstructuracionProyecto)
class EstructuracionProyectoAdmin(admin.ModelAdmin):
    list_display  = ('proyecto', 'version', 'es_vigente', 'generada_por_ia',
                     'margen_neto', 'roi', 'creada_en')
    list_filter   = ('es_vigente', 'generada_por_ia')
    readonly_fields = ('creada_en', 'version')
