from django.contrib import admin

from .models import ConstructoraPortalUser


@admin.register(ConstructoraPortalUser)
class ConstructoraPortalUserAdmin(admin.ModelAdmin):
    list_display = (
        'email', 'telefono', 'telefono_verificado', 'email_verificado',
        'activo', 'ultimo_login', 'created_at',
    )
    list_filter = ('activo', 'telefono_verificado', 'email_verificado')
    search_fields = ('email', 'telefono', 'constructora__name')
    raw_id_fields = ('constructora', 'perfil_marketplace')
    readonly_fields = ('otp_code', 'otp_expires_at', 'otp_intentos')
