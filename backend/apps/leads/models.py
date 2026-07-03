from django.db import models
from django.contrib.contenttypes.fields import GenericRelation

ESTADO_CONTACTO_CHOICES = [
    ('sin_contactar',  'Sin contactar'),
    ('contactado',     'Contactado'),
    ('interesado',     'Interesado'),
    ('calificado',     'Calificado'),
    ('en_negociacion', 'En negociación'),
    ('firmado',        'Firmado'),
    ('descartado',     'Descartado'),
]

ESTADO_LEAD_CHOICES = [
    ('nuevo',             'Nuevo'),
    ('contactado',        'Contactado'),
    ('interesado',        'Interesado'),
    ('calificado',        'Calificado'),
    ('cita_agendada',     'Cita agendada'),
    ('propuesta_enviada', 'Propuesta enviada'),
    ('en_negociacion',    'En negociación'),
    ('promesa_firmada',   'Promesa firmada'),
    ('descartado',        'Descartado'),
]

TIPO_INTERACCION_CHOICES = [
    ('whatsapp',     'WhatsApp'),
    ('llamada',      'Llamada'),
    ('email',        'Email'),
    ('visita',       'Visita'),
    ('cita',         'Cita'),
    ('nota_interna', 'Nota interna'),
]


class Propietario(models.Model):
    """
    Persona física o jurídica dueña o contacto de uno o más predios.
    Entidad central del CRM de HAB.
    """
    TIPO_CHOICES = [
        ('persona_natural',  'Persona natural'),
        ('persona_juridica', 'Persona jurídica'),
    ]

    nombre               = models.CharField(max_length=200)
    tipo                 = models.CharField(max_length=20, choices=TIPO_CHOICES, default='persona_natural')
    cedula_nit           = models.CharField(max_length=20, blank=True)

    telefono_principal   = models.CharField(max_length=20)
    telefono_secundario  = models.CharField(max_length=20, blank=True)
    email                = models.EmailField(blank=True)
    whatsapp_phone       = models.CharField(max_length=20, blank=True, db_index=True)

    ciudad               = models.CharField(max_length=100, blank=True)
    direccion_residencia = models.CharField(max_length=300, blank=True)

    predios = models.ManyToManyField(
        'scraping.Predio',
        through='PropietarioPredio',
        related_name='propietarios',
        blank=True,
    )

    asesor_asignado = models.ForeignKey(
        'accounts.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='propietarios',
    )
    estado_contacto = models.CharField(
        max_length=20,
        choices=ESTADO_CONTACTO_CHOICES,
        default='sin_contactar',
        db_index=True,
    )
    temperatura = models.CharField(
        max_length=10,
        choices=[('frio', 'Frío'), ('tibio', 'Tibio'), ('caliente', 'Caliente')],
        default='frio',
    )
    fuente_origen = models.CharField(max_length=100, blank=True)
    etiquetas     = models.JSONField(default=list)

    notas_internas    = GenericRelation('shared.Nota')
    pipeline_position = GenericRelation('shared.PipelinePosition')

    primer_contacto = models.DateTimeField(null=True, blank=True)
    ultimo_contacto = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Propietario'
        verbose_name_plural = 'Propietarios'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.nombre} ({self.telefono_principal})'


class PropietarioPredio(models.Model):
    """Tabla pivote M2M propietario ↔ predio con metadatos de la relación."""
    ROL_CHOICES = [
        ('propietario',  'Propietario'),
        ('heredero',     'Heredero'),
        ('apoderado',    'Apoderado'),
        ('arrendatario', 'Arrendatario'),
    ]

    propietario          = models.ForeignKey(Propietario, on_delete=models.CASCADE)
    predio               = models.ForeignKey('scraping.Predio', on_delete=models.CASCADE)
    porcentaje_propiedad = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    rol                  = models.CharField(max_length=20, choices=ROL_CHOICES, default='propietario')
    es_contacto_principal = models.BooleanField(default=False)
    notas                = models.TextField(blank=True)

    class Meta:
        unique_together = [['propietario', 'predio', 'rol']]
        verbose_name = 'Propietario-Predio'

    def __str__(self):
        return f'{self.propietario} → {self.predio} ({self.rol})'


class Lead(models.Model):
    """Lead CRM — referencia a Propietario y opcionalmente a Predio."""
    nombre  = models.CharField(max_length=200)
    telefono = models.CharField(max_length=20)
    email   = models.EmailField(blank=True)
    cedula  = models.CharField(max_length=20, blank=True)

    predio = models.ForeignKey(
        'scraping.Predio',
        null=True, blank=True,
        on_delete=models.SET_NULL,
    )
    propietario = models.ForeignKey(
        Propietario,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='leads',
    )
    asesor = models.ForeignKey(
        'accounts.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='leads',
    )
    estado = models.CharField(max_length=30, choices=ESTADO_LEAD_CHOICES, default='nuevo', db_index=True)
    temperatura = models.CharField(
        max_length=10,
        choices=[('frio', 'Frío'), ('tibio', 'Tibio'), ('caliente', 'Caliente')],
        default='frio',
    )
    fuente_origen = models.CharField(max_length=100, blank=True)

    primer_contacto     = models.DateTimeField(null=True, blank=True)
    ultimo_contacto     = models.DateTimeField(null=True, blank=True)
    proxima_accion      = models.DateTimeField(null=True, blank=True)
    nota_proxima_accion = models.TextField(blank=True)

    notas     = models.TextField(blank=True)
    etiquetas = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lead'

    def __str__(self):
        return f'{self.nombre} ({self.estado})'


class InteraccionLead(models.Model):
    lead        = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='interacciones')
    usuario     = models.ForeignKey('accounts.User', null=True, on_delete=models.SET_NULL)
    tipo        = models.CharField(max_length=20, choices=TIPO_INTERACCION_CHOICES)
    descripcion = models.TextField()
    resultado   = models.CharField(max_length=200, blank=True)
    creado_en   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']


class Cita(models.Model):
    MODALIDAD_CHOICES = [
        ('presencial',   'Presencial'),
        ('videollamada', 'Videollamada'),
        ('telefonica',   'Telefónica'),
    ]
    ESTADO_CHOICES = [
        ('programada', 'Programada'),
        ('confirmada', 'Confirmada'),
        ('realizada',  'Realizada'),
        ('cancelada',  'Cancelada'),
        ('no_show',    'No show'),
    ]

    lead       = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='citas')
    asesor     = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='citas')
    fecha_hora = models.DateTimeField()
    modalidad  = models.CharField(max_length=20, choices=MODALIDAD_CHOICES)
    ubicacion  = models.CharField(max_length=300, blank=True)
    url_meet   = models.URLField(blank=True)
    estado     = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='programada')
    notas      = models.TextField(blank=True)
    creado_en  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_hora']
