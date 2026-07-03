from django.db import models
from django.utils.text import slugify
from django.contrib.contenttypes.fields import GenericRelation

FASE_PROYECTO_CHOICES = [
    ('estructuracion', 'Estructuración'),
    ('presentado',     'Presentado'),
    ('en_negociacion', 'En negociación'),
    ('promesa',        'Promesa'),
    ('en_obra',        'En obra'),
    ('entregado',      'Entregado'),
    ('descartado',     'Descartado'),
]


class Proyecto(models.Model):
    # Origen trazable
    predio = models.ForeignKey(
        'scraping.Predio',
        on_delete=models.PROTECT,
        related_name='proyectos',
    )
    predios_consolidados = models.ManyToManyField(
        'scraping.Predio',
        blank=True,
        related_name='proyectos_consolidados',
    )
    analisis = models.ForeignKey(
        'viabilidad.AnalisisViabilidad',
        on_delete=models.PROTECT,
        related_name='proyectos',
    )
    propietarios = models.ManyToManyField(
        'leads.Propietario',
        through='ProyectoPropietario',
        related_name='proyectos',
        blank=True,
    )

    nombre = models.CharField(max_length=200)
    slug   = models.SlugField(unique=True)
    codigo = models.CharField(max_length=20, unique=True)
    fase   = models.CharField(max_length=20, choices=FASE_PROYECTO_CHOICES, default='estructuracion', db_index=True)

    gerente       = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='proyectos_gestionados',
    )
    constructoras = models.ManyToManyField('accounts.Constructora', blank=True)

    # Fees y proyección financiera HAB
    fee_estructuracion   = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    pct_gerencia         = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pct_ventas           = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    valor_total_estimado = models.DecimalField(max_digits=25, decimal_places=2, null=True, blank=True)
    ingresos_estructuracion_real = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    ingresos_gerencia_real       = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    ingresos_ventas_real         = models.DecimalField(max_digits=20, decimal_places=2, default=0)

    # Documentos
    estructuracion_generada_en = models.DateTimeField(null=True, blank=True)
    presentacion_url           = models.URLField(blank=True)
    doc_estructuracion_url     = models.URLField(blank=True)

    # Fechas clave
    fecha_estructuracion   = models.DateField(null=True, blank=True)
    fecha_presentacion     = models.DateField(null=True, blank=True)
    fecha_inicio_obra      = models.DateField(null=True, blank=True)
    fecha_entrega_estimada = models.DateField(null=True, blank=True)

    notas_internas = GenericRelation('shared.Nota')
    pipeline_pos   = GenericRelation('shared.PipelinePosition')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Proyecto'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.codigo} — {self.nombre}'


class ProyectoPropietario(models.Model):
    proyecto          = models.ForeignKey(Proyecto, on_delete=models.CASCADE)
    propietario       = models.ForeignKey('leads.Propietario', on_delete=models.CASCADE)
    porcentaje_aporte = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    condicion_aporte  = models.TextField(blank=True)
    firmado           = models.BooleanField(default=False)
    fecha_firma       = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = [['proyecto', 'propietario']]
        verbose_name = 'Propietario del proyecto'


class HitoProyecto(models.Model):
    proyecto       = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='hitos')
    tipo           = models.CharField(max_length=100)
    descripcion    = models.TextField()
    fecha_planeada = models.DateField()
    fecha_real     = models.DateField(null=True, blank=True)
    completado     = models.BooleanField(default=False)
    evidencia_url  = models.URLField(blank=True)
    creado_en      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_planeada']
        verbose_name = 'Hito del proyecto'


class EstructuracionProyecto(models.Model):
    """Snapshot financiero completo con versiones e historial."""
    proyecto        = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='estructuraciones')
    version         = models.IntegerField(default=1)
    es_vigente      = models.BooleanField(default=True)
    generada_por_ia = models.BooleanField(default=False)
    generada_por    = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL)

    # Datos del predio
    area_lote        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    area_construida  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    area_vendible    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unidades_totales = models.IntegerField(default=0)
    unidades_vis     = models.IntegerField(default=0)
    unidades_no_vis  = models.IntegerField(default=0)
    pisos            = models.IntegerField(default=0)

    # Ingresos
    precio_m2_vis      = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    precio_m2_no_vis   = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    precio_m2_promedio = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    ingresos_brutos    = models.DecimalField(max_digits=25, decimal_places=2, default=0)

    # Costos
    costo_terreno      = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_construccion = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_urbanismo    = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_diseno       = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_ventas       = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_gerencia     = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_legales      = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costos_imprevistos = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    costo_total        = models.DecimalField(max_digits=25, decimal_places=2, default=0)

    # Resultados
    utilidad_bruta       = models.DecimalField(max_digits=25, decimal_places=2, default=0)
    margen_bruto         = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    utilidad_neta        = models.DecimalField(max_digits=25, decimal_places=2, default=0)
    margen_neto          = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    roi                  = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    tir_estimada         = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    punto_equilibrio_uds = models.IntegerField(null=True, blank=True)
    valor_max_predio     = models.DecimalField(max_digits=20, decimal_places=2, default=0)

    # HAB fees
    hab_fee_estructuracion = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    hab_fee_gerencia       = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    hab_fee_ventas         = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    hab_ingreso_total      = models.DecimalField(max_digits=25, decimal_places=2, default=0)

    # Flujo de caja
    flujo_caja_mensual = models.JSONField(default=list)

    # Narrativa IA
    resumen_ejecutivo = models.TextField(blank=True)
    fortalezas        = models.JSONField(default=list)
    riesgos           = models.JSONField(default=list)
    recomendaciones   = models.JSONField(default=list)

    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version']
        verbose_name = 'Estructuración del proyecto'
