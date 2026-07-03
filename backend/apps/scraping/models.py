from django.db import models
from django.contrib.contenttypes.fields import GenericRelation

TIPO_PREDIO_CHOICES = [
    ('casa',        'Casa'),
    ('lote',        'Lote'),
    ('apartamento', 'Apartamento'),
    ('local',       'Local'),
]

ESTADO_PREDIO_CHOICES = [
    ('nuevo',       'Nuevo'),
    ('en_analisis', 'En análisis'),
    ('viable',      'Viable'),
    ('no_viable',   'No viable'),
    ('contactado',  'Contactado'),
    ('descartado',  'Descartado'),
]


class FuenteScraping(models.Model):
    nombre           = models.CharField(max_length=100)
    url_base         = models.URLField()
    activo           = models.BooleanField(default=True)
    configuracion    = models.JSONField(default=dict)
    ultima_ejecucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Fuente de scraping'

    def __str__(self):
        return self.nombre


class ZonaPOT(models.Model):
    """Parámetros normativos POT de Bogotá por zona/barrio."""
    nombre_zona           = models.CharField(max_length=200)
    barrio                = models.CharField(max_length=200, blank=True, db_index=True)
    localidad             = models.CharField(max_length=100)
    uso_suelo_principal   = models.CharField(max_length=100)
    indice_construccion   = models.DecimalField(max_digits=4, decimal_places=2, default=2.0)
    indice_ocupacion      = models.DecimalField(max_digits=4, decimal_places=2, default=0.6)
    altura_max_pisos      = models.IntegerField(default=6)
    densidad_max_viv      = models.IntegerField(null=True, blank=True)
    es_zona_densificacion = models.BooleanField(default=False)
    actualizado_en        = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Zona POT'
        verbose_name_plural = 'Zonas POT'

    def __str__(self):
        return f'{self.nombre_zona} — {self.barrio}'


class Predio(models.Model):
    # Identificación
    fuente         = models.ForeignKey(FuenteScraping, on_delete=models.CASCADE, related_name='predios')
    url_origen     = models.URLField(unique=True)
    codigo_externo = models.CharField(max_length=100, blank=True)

    # Ubicación
    barrio    = models.CharField(max_length=200, db_index=True)
    localidad = models.CharField(max_length=200)
    ciudad    = models.CharField(max_length=100, default='Bogotá')
    direccion = models.CharField(max_length=300, blank=True)
    latitud   = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitud  = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    # Características
    tipo              = models.CharField(max_length=20, choices=TIPO_PREDIO_CHOICES)
    area_lote         = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    area_construida   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estrato           = models.IntegerField(null=True, blank=True, db_index=True)
    pisos             = models.IntegerField(null=True, blank=True)
    anio_construccion = models.IntegerField(null=True, blank=True)

    # Precio
    precio_publicado = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    precio_m2        = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    # Estado en el pipeline
    estado = models.CharField(max_length=20, choices=ESTADO_PREDIO_CHOICES, default='nuevo', db_index=True)

    # Metadata
    imagenes        = models.JSONField(default=list)
    descripcion_raw = models.TextField(blank=True)
    raw_data        = models.JSONField(default=dict)

    # Prefactibilidad automática
    score_prefactibilidad       = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, db_index=True)
    tags                        = models.JSONField(default=list)
    tags_manuales               = models.JSONField(default=list)
    metricas_prefact            = models.JSONField(default=dict)
    detalle_scores              = models.JSONField(default=dict)
    prefact_calculada_en        = models.DateTimeField(null=True, blank=True)
    precio_m2_referencia_barrio = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    # Generic relations
    notas_internas = GenericRelation('shared.Nota')
    pipeline_pos   = GenericRelation('shared.PipelinePosition')

    primera_deteccion    = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    @property
    def updated_at(self):
        return self.ultima_actualizacion

    class Meta:
        verbose_name = 'Predio'
        verbose_name_plural = 'Predios'
        ordering = ['-primera_deteccion']
        indexes = [
            models.Index(fields=['estado', 'score_prefactibilidad']),
            models.Index(fields=['barrio', 'estrato']),
        ]

    def __str__(self):
        return f'{self.direccion or self.barrio} ({self.tipo})'


class EjecucionScraping(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('corriendo', 'Corriendo'),
        ('exitoso',   'Exitoso'),
        ('fallido',   'Fallido'),
    ]
    fuente              = models.ForeignKey(FuenteScraping, on_delete=models.CASCADE, related_name='ejecuciones')
    inicio              = models.DateTimeField()
    fin                 = models.DateTimeField(null=True, blank=True)
    predios_encontrados = models.IntegerField(default=0)
    predios_nuevos      = models.IntegerField(default=0)
    errores             = models.IntegerField(default=0)
    log                 = models.TextField(blank=True)
    estado              = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')

    class Meta:
        ordering = ['-inicio']
