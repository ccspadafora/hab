from django.contrib import admin
from .models import Propietario, PropietarioPredio, Lead, InteraccionLead, Cita


class PropietarioPredioInline(admin.TabularInline):
    model = PropietarioPredio
    extra = 0


@admin.register(Propietario)
class PropietarioAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'tipo', 'telefono_principal', 'whatsapp_phone',
                     'estado_contacto', 'temperatura', 'asesor_asignado')
    list_filter   = ('tipo', 'estado_contacto', 'temperatura')
    search_fields = ('nombre', 'cedula_nit', 'telefono_principal', 'whatsapp_phone')
    inlines       = [PropietarioPredioInline]


class InteraccionLeadInline(admin.TabularInline):
    model  = InteraccionLead
    extra  = 0
    fields = ('tipo', 'descripcion', 'resultado', 'creado_en')
    readonly_fields = ('creado_en',)


class CitaInline(admin.TabularInline):
    model  = Cita
    extra  = 0
    fields = ('asesor', 'fecha_hora', 'modalidad', 'estado')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'telefono', 'estado', 'temperatura', 'asesor', 'created_at')
    list_filter  = ('estado', 'temperatura')
    search_fields = ('nombre', 'telefono', 'email')
    inlines      = [InteraccionLeadInline, CitaInline]
