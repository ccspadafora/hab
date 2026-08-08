from __future__ import annotations

from django.db import models


FASE_NEGOCIACION_CHOICES = [
    ('inicio',            'Inicio — presentación formal'),
    ('due_diligence',     'Due diligence'),
    ('oferta_inicial',    'Oferta inicial de constructora'),
    ('contrapropuesta',   'Contrapropuesta'),
    ('acuerdo_verbal',    'Acuerdo verbal'),
    ('documentacion',     'Preparación de documentos'),
    ('firma',             'Firma'),
    ('cerrada_exitosa',   'Cerrada — éxito'),
    ('cerrada_sin_exito', 'Cerrada — sin acuerdo'),
]


class Negociacion(models.Model):
    match = models.OneToOneField(
        'marketplace_matching.Match',
        on_delete=models.PROTECT,
        related_name='negociacion',
    )
    asesor_hab = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='negociaciones_marketplace',
    )
    fase = models.CharField(
        max_length=30,
        choices=FASE_NEGOCIACION_CHOICES,
        default='inicio',
    )
    valor_oferta_constructora = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    tipo_compensacion = models.CharField(
        max_length=20,
        choices=[
            ('dinero', 'Dinero'),
            ('unidades', 'Unidades'),
            ('mixto', 'Mixto'),
        ],
        null=True,
        blank=True,
    )
    unidades_ofrecidas = models.IntegerField(null=True, blank=True)
    valor_dinero_adicional = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    condiciones_especiales = models.TextField(blank=True)
    fee_estructuracion_hab = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    fee_gerencia_hab = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    fee_ventas_hab = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    tipo_garantia = models.CharField(max_length=30, blank=True)
    descripcion_garantia = models.TextField(blank=True)
    fiduciaria = models.CharField(max_length=200, blank=True)
    documentos = models.JSONField(default=list, blank=True)
    fecha_cierre_meta = models.DateField(null=True, blank=True)
    cerrada_en = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Negociación'
        verbose_name_plural = 'Negociaciones'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Negociacion({self.match_id} · {self.fase})'


class EventoNegociacion(models.Model):
    """Audit trail inmutable de cada acción en la negociación."""
    negociacion = models.ForeignKey(
        Negociacion,
        on_delete=models.CASCADE,
        related_name='eventos',
    )
    actor = models.CharField(
        max_length=20,
        choices=[
            ('hab', 'HAB'),
            ('constructora', 'Constructora'),
            ('propietario', 'Propietario'),
            ('sistema', 'Sistema'),
        ],
    )
    tipo = models.CharField(max_length=100)
    descripcion = models.TextField()
    datos = models.JSONField(default=dict, blank=True)
    usuario = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='eventos_negociacion',
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Evento de negociación'
        verbose_name_plural = 'Eventos de negociación'

    def __str__(self) -> str:
        return f'Evento({self.tipo} · {self.actor} · {self.creado_en:%Y-%m-%d})'
