from __future__ import annotations

from django.db import models
from django.contrib.contenttypes.fields import GenericRelation

from .managers import PublicacionInmuebleManager


TIPO_INMUEBLE_CHOICES = [
    ('casa',        'Casa unifamiliar'),
    ('lote',        'Lote sin construir'),
    ('apartamento', 'Apartamento'),
    ('local',       'Local comercial'),
    ('bodega',      'Bodega'),
]

ESTADO_PUBLICACION_CHOICES = [
    ('borrador',           'Borrador'),
    ('en_revision',        'En revisión por HAB'),
    ('activa',             'Activa — visible'),
    ('en_negociacion',     'En negociación'),
    ('cerrada_exitosa',    'Cerrada — acuerdo logrado'),
    ('cerrada_sin_exito',  'Cerrada — sin acuerdo'),
    ('rechazada',          'Rechazada'),
]

ESTADO_INMUEBLE_CHOICES = [
    ('muy_bueno',  'Muy bueno — listo para habitar'),
    ('bueno',      'Bueno — mantenimiento menor'),
    ('regular',    'Regular — requiere remodelación'),
    ('demolicion', 'Para demolición'),
]


class PublicacionInmueble(models.Model):
    """
    Inmueble publicado por un propietario en el marketplace (canal inbound).
    Diferente a Predio (canal outbound / scraping).
    """
    propietario = models.ForeignKey(
        'leads.Propietario',
        on_delete=models.PROTECT,
        related_name='publicaciones',
    )
    titulo = models.CharField(max_length=200, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_INMUEBLE_CHOICES)
    direccion = models.CharField(max_length=300)
    barrio = models.CharField(max_length=200)
    localidad = models.CharField(max_length=200)
    ciudad = models.CharField(max_length=100, default='Bogotá')
    latitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    area_lote = models.DecimalField(max_digits=10, decimal_places=2)
    area_construida = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pisos = models.IntegerField(null=True, blank=True)
    habitaciones = models.IntegerField(null=True, blank=True)
    banos = models.IntegerField(null=True, blank=True)
    estrato = models.IntegerField()
    anio_construccion = models.IntegerField(null=True, blank=True)
    estado_inmueble = models.CharField(
        max_length=20, choices=ESTADO_INMUEBLE_CHOICES, blank=True,
    )
    descripcion = models.TextField(blank=True)
    precio_esperado = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    acepta_aporte = models.BooleanField(default=True)
    fotos = models.JSONField(default=list, blank=True)
    documentos = models.JSONField(default=list, blank=True)
    identidad_verificada = models.BooleanField(default=False)
    propiedad_verificada = models.BooleanField(default=False)
    verificado_por = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='publicaciones_verificadas',
    )
    verificado_en = models.DateTimeField(null=True, blank=True)
    notas_verificacion = models.TextField(blank=True)
    score_prefactibilidad = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
    )
    tags_prefact = models.JSONField(default=list, blank=True)
    metricas_prefact = models.JSONField(default=dict, blank=True)
    prefact_calculada_en = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_PUBLICACION_CHOICES,
        default='borrador',
        db_index=True,
    )
    motivo_rechazo = models.TextField(blank=True)
    visible_constructoras = models.BooleanField(default=False)
    datos_anonimizados = models.BooleanField(default=True)
    predio_vinculado = models.ForeignKey(
        'scraping.Predio',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='publicacion_marketplace',
    )
    proyecto_generado = models.ForeignKey(
        'proyectos.Proyecto',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='publicacion_origen',
    )
    notas_internas = GenericRelation('shared.Nota')
    publicado_en = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = PublicacionInmuebleManager()

    class Meta:
        ordering = ['-score_prefactibilidad', '-publicado_en']
        indexes = [
            models.Index(fields=['estado', 'visible_constructoras']),
            models.Index(fields=['barrio', 'localidad', 'estado']),
            models.Index(fields=['score_prefactibilidad', 'estado']),
            models.Index(fields=['propietario', 'estado']),
        ]
        verbose_name = 'Publicación de inmueble'
        verbose_name_plural = 'Publicaciones de inmuebles'

    def __str__(self) -> str:
        return f'Publicacion({self.barrio} · {self.tipo} · {self.estado})'

    @property
    def esta_verificada(self) -> bool:
        return self.identidad_verificada and self.propiedad_verificada

    @property
    def puede_activarse(self) -> bool:
        score = self.score_prefactibilidad or 0
        return self.esta_verificada and float(score) >= 30


class EstructuracionExpress(models.Model):
    """
    Resumen financiero express generado por IA para una publicación marketplace.
    Persistido tras task_estructuracion_express.
    """
    publicacion = models.OneToOneField(
        PublicacionInmueble,
        on_delete=models.CASCADE,
        related_name='estructuracion_express',
    )
    unidades_proyectadas = models.IntegerField(null=True, blank=True)
    area_vendible_est = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )
    ingresos_brutos_est = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    costo_total_est = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    margen_bruto_est = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
    )
    roi_est = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
    )
    valor_max_predio_est = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
    )
    resumen = models.TextField(blank=True)
    datos_completos = models.JSONField(default=dict, blank=True)
    modelo_ia = models.CharField(max_length=100, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Estructuración express'
        verbose_name_plural = 'Estructuraciones express'

    def __str__(self) -> str:
        return f'EstructuracionExpress(pub={self.publicacion_id})'
