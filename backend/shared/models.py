from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Nota(models.Model):
    """
    Nota interna adjuntable a cualquier entidad del sistema via GenericForeignKey.
    Usar en: Predio, AnalisisViabilidad, Lead/Propietario, Proyecto.
    """
    TIPO_CHOICES = [
        ('interna',     'Interna'),
        ('decision',    'Decisión'),
        ('alerta',      'Alerta'),
        ('seguimiento', 'Seguimiento'),
    ]

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id    = models.PositiveIntegerField()
    entidad      = GenericForeignKey('content_type', 'object_id')

    autor  = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='notas',
    )
    texto          = models.TextField()
    tipo           = models.CharField(max_length=20, choices=TIPO_CHOICES, default='interna')
    es_fijada      = models.BooleanField(default=False)
    adjuntos       = models.JSONField(default=list)

    creada_en      = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-es_fijada', '-creada_en']
        indexes  = [
            models.Index(fields=['content_type', 'object_id']),
        ]
        verbose_name = 'Nota'
        verbose_name_plural = 'Notas'

    def __str__(self):
        return f'Nota [{self.tipo}] en {self.content_type.model} #{self.object_id}'


class PipelinePosition(models.Model):
    """
    Persiste el orden de cada entidad dentro de su columna de pipeline (kanban).
    Una fila por entidad gestionada como tarjeta.
    """
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id    = models.PositiveIntegerField()
    entidad      = GenericForeignKey('content_type', 'object_id')
    orden        = models.IntegerField(default=0)

    class Meta:
        unique_together = [['content_type', 'object_id']]
        ordering        = ['orden']
        verbose_name = 'Posición en pipeline'
