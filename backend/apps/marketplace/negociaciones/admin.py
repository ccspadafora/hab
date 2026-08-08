from django.contrib import admin

from .models import EventoNegociacion, Negociacion


class EventoNegociacionInline(admin.TabularInline):
    model = EventoNegociacion
    extra = 0
    readonly_fields = ('actor', 'tipo', 'descripcion', 'datos', 'usuario', 'creado_en')
    can_delete = False


@admin.register(Negociacion)
class NegociacionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'match', 'asesor_hab', 'fase',
        'valor_oferta_constructora', 'created_at',
    )
    list_filter = ('fase',)
    raw_id_fields = ('match', 'asesor_hab')
    inlines = [EventoNegociacionInline]


@admin.register(EventoNegociacion)
class EventoNegociacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'negociacion', 'actor', 'tipo', 'creado_en')
    list_filter = ('actor', 'tipo')
    raw_id_fields = ('negociacion', 'usuario')
