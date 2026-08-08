from django.contrib import admin

from .models import Garantia


@admin.register(Garantia)
class GarantiaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'activa', 'negociacion', 'created_at')
    list_filter = ('activa', 'tipo')
    raw_id_fields = ('negociacion',)
