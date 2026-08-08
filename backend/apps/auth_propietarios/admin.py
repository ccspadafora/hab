from django.contrib import admin

from .models import PropietarioPortalUser


@admin.register(PropietarioPortalUser)
class PropietarioPortalUserAdmin(admin.ModelAdmin):
    list_display = (
        'telefono', 'email', 'telefono_verificado', 'activo',
        'ultimo_login', 'created_at',
    )
    list_filter = ('activo', 'telefono_verificado')
    search_fields = ('telefono', 'email', 'propietario__nombre')
    raw_id_fields = ('propietario',)
    readonly_fields = ('otp_code', 'otp_expires_at', 'otp_intentos')
