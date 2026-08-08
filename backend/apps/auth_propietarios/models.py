from __future__ import annotations

from django.db import models


class PropietarioPortalUser(models.Model):
    """
    Cuenta de acceso al portal público para propietarios.
    Se vincula con leads.Propietario (entidad CRM existente).
    Un propietario puede no tener cuenta en el CRM aún — se crea al registrarse.
    """
    propietario = models.OneToOneField(
        'leads.Propietario',
        on_delete=models.CASCADE,
        related_name='portal_user',
    )
    telefono = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True)
    password_hash = models.CharField(max_length=128)
    otp_code = models.CharField(max_length=6, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    otp_intentos = models.IntegerField(default=0)
    telefono_verificado = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    bloqueado_hasta = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Portal User — Propietario'
        verbose_name_plural = 'Portal Users — Propietarios'
        indexes = [
            models.Index(fields=['telefono']),
        ]

    def __str__(self) -> str:
        return f'PropietarioPortal({self.telefono})'
