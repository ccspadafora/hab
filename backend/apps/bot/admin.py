from django.contrib import admin
from .models import Conversacion, Mensaje


class MensajeInline(admin.TabularInline):
    model  = Mensaje
    extra  = 0
    fields = ('direccion', 'tipo', 'contenido', 'generado_por_ia', 'enviado_en')
    readonly_fields = ('enviado_en',)


@admin.register(Conversacion)
class ConversacionAdmin(admin.ModelAdmin):
    list_display  = ('wa_contact_phone', 'propietario', 'estado', 'ia_activa',
                     'etapa_bot', 'asignado_a', 'ultimo_mensaje')
    list_filter   = ('estado', 'ia_activa', 'etapa_bot')
    search_fields = ('wa_contact_phone', 'propietario__nombre')
    readonly_fields = ('iniciado_en', 'ultimo_mensaje')
    inlines       = [MensajeInline]


@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display  = ('conversacion', 'direccion', 'tipo', 'generado_por_ia', 'enviado_en')
    list_filter   = ('direccion', 'tipo', 'generado_por_ia')
    search_fields = ('contenido', 'wa_message_id')
