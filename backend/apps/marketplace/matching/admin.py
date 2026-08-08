from django.contrib import admin

from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'publicacion', 'constructora', 'score_match',
        'origen', 'estado', 'created_at',
    )
    list_filter = ('estado', 'origen')
    search_fields = (
        'publicacion__barrio',
        'constructora__nombre_comercial',
    )
    raw_id_fields = ('publicacion', 'constructora')
