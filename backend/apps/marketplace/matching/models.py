from __future__ import annotations

from django.db import models


ESTADO_MATCH_CHOICES = [
    ('sugerido',        'Sugerido por el sistema'),
    ('notificado',      'Constructora notificada'),
    ('interesada',      'Constructora interesada'),
    ('rechazado_const', 'Rechazado por constructora'),
    ('rechazado_hab',   'Rechazado por HAB'),
    ('en_negociacion',  'En negociación formal'),
]


class Match(models.Model):
    """
    Conexión entre una publicación y una constructora.
    Puede ser automático (matching engine) o por interés directo.
    """
    publicacion = models.ForeignKey(
        'marketplace_publicaciones.PublicacionInmueble',
        on_delete=models.CASCADE,
        related_name='matches',
    )
    constructora = models.ForeignKey(
        'marketplace_perfiles_constructora.PerfilConstructoraMP',
        on_delete=models.CASCADE,
        related_name='matches',
    )
    score_match = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
    )
    origen = models.CharField(
        max_length=30,
        choices=[
            ('automatico',              'Automático — sistema'),
            ('constructora_interesada', 'Interés directo constructora'),
        ],
    )
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_MATCH_CHOICES,
        default='sugerido',
        db_index=True,
    )
    motivo_rechazo = models.TextField(blank=True)
    nota_constructora = models.TextField(blank=True)
    nota_interna = models.TextField(blank=True)
    notificado_en = models.DateTimeField(null=True, blank=True)
    respondido_en = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['publicacion', 'constructora']]
        ordering = ['-score_match', '-created_at']
        verbose_name = 'Match'
        verbose_name_plural = 'Matches'
        indexes = [
            models.Index(fields=['estado', 'publicacion']),
            models.Index(fields=['constructora', 'estado']),
        ]

    def __str__(self) -> str:
        return f'Match({self.publicacion_id} ↔ {self.constructora_id} · {self.estado})'
