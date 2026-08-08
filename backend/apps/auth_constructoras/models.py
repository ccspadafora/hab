from __future__ import annotations

from django.db import models


class ConstructoraPortalUser(models.Model):
    """
    Cuenta de acceso al portal público para constructoras.
    Vinculada a accounts.Constructora y opcionalmente a PerfilConstructoraMP.
    """
    constructora = models.OneToOneField(
        'accounts.Constructora',
        on_delete=models.CASCADE,
        related_name='portal_user',
    )
    perfil_marketplace = models.OneToOneField(
        'marketplace_perfiles_constructora.PerfilConstructoraMP',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='portal_user',
    )
    telefono = models.CharField(max_length=20, unique=True)
    email = models.EmailField()
    password_hash = models.CharField(max_length=128)
    otp_code = models.CharField(max_length=6, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    otp_intentos = models.IntegerField(default=0)
    telefono_verificado = models.BooleanField(default=False)
    email_verificado = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    bloqueado_hasta = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Portal User — Constructora'
        verbose_name_plural = 'Portal Users — Constructoras'
        indexes = [
            models.Index(fields=['telefono']),
            models.Index(fields=['email']),
        ]

    def __str__(self) -> str:
        return f'ConstructoraPortal({self.email})'
