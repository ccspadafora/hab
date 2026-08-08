from django.contrib import admin

from .models import PerfilConstructoraMP, SolicitudCertificacionConstructora


@admin.register(PerfilConstructoraMP)
class PerfilConstructoraMPAdmin(admin.ModelAdmin):
    list_display = (
        'nombre_comercial', 'nit', 'estado_certificacion',
        'nivel_certificacion', 'total_cierres', 'tasa_cierre',
    )
    list_filter = ('estado_certificacion', 'nivel_certificacion')
    search_fields = ('nombre_comercial', 'nit')
    raw_id_fields = ('constructora', 'certificada_por')


@admin.register(SolicitudCertificacionConstructora)
class SolicitudCertificacionConstructoraAdmin(admin.ModelAdmin):
    list_display = (
        'nombre_empresa', 'nit', 'contacto_email', 'estado', 'created_at',
    )
    list_filter = ('estado',)
    search_fields = ('nombre_empresa', 'nit', 'contacto_email')
    raw_id_fields = ('revisada_por',)
