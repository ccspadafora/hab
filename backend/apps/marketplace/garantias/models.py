from __future__ import annotations

from django.db import models


class Garantia(models.Model):
    """
    Placeholder para garantías fiduciarias / polizas asociadas a negociaciones.
    Modelo mínimo para que makemigrations funcione; se expandirá en siguientes specs.
    """
    negociacion = models.ForeignKey(
        'marketplace_negociaciones.Negociacion',
        on_delete=models.CASCADE,
        related_name='garantias',
        null=True,
        blank=True,
    )
    tipo = models.CharField(max_length=50, blank=True)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Garantía'
        verbose_name_plural = 'Garantías'

    def __str__(self) -> str:
        return f'Garantia({self.tipo or "sin tipo"} · {self.pk})'
