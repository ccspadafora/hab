from django.db import models


class Conversacion(models.Model):
    ESTADO_CHOICES = [
        ('activa',   'Activa'),
        ('pausada',  'Pausada'),
        ('cerrada',  'Cerrada'),
        ('escalada', 'Escalada'),
    ]
    ETAPA_CHOICES = [
        ('inicio',       'Inicio'),
        ('calificacion', 'Calificación'),
        ('presentacion', 'Presentación'),
        ('objeciones',   'Objeciones'),
        ('agendamiento', 'Agendamiento'),
        ('cerrada',      'Cerrada'),
    ]

    propietario = models.ForeignKey(
        'leads.Propietario',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='conversaciones',
    )
    predio_contexto = models.ForeignKey(
        'scraping.Predio',
        null=True, blank=True,
        on_delete=models.SET_NULL,
    )

    wa_phone_id      = models.CharField(max_length=50)
    wa_contact_phone = models.CharField(max_length=20, db_index=True)

    estado    = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activa', db_index=True)
    ia_activa = models.BooleanField(default=True)
    ia_desactivada_por = models.ForeignKey(
        'accounts.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='chats_tomados',
    )
    ia_desactivada_en    = models.DateTimeField(null=True, blank=True)
    motivo_desactivacion = models.CharField(max_length=200, blank=True)

    etapa_bot  = models.CharField(max_length=20, choices=ETAPA_CHOICES, default='inicio')
    contexto   = models.JSONField(default=dict)
    asignado_a = models.ForeignKey(
        'accounts.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='conversaciones_asignadas',
    )

    iniciado_en   = models.DateTimeField(auto_now_add=True)
    ultimo_mensaje = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-ultimo_mensaje']
        verbose_name = 'Conversación'
        indexes = [
            models.Index(fields=['wa_contact_phone', 'estado']),
        ]

    def __str__(self):
        return f'Conv {self.wa_contact_phone} ({self.estado})'


class Mensaje(models.Model):
    DIRECCION_CHOICES = [
        ('entrante', 'Entrante'),
        ('saliente', 'Saliente'),
    ]
    TIPO_CHOICES = [
        ('texto',     'Texto'),
        ('imagen',    'Imagen'),
        ('documento', 'Documento'),
        ('audio',     'Audio'),
        ('plantilla', 'Plantilla'),
    ]

    conversacion    = models.ForeignKey(Conversacion, on_delete=models.CASCADE, related_name='mensajes')
    wa_message_id   = models.CharField(max_length=100, unique=True)
    direccion       = models.CharField(max_length=10, choices=DIRECCION_CHOICES)
    tipo            = models.CharField(max_length=20, choices=TIPO_CHOICES, default='texto')
    contenido       = models.TextField()
    metadata        = models.JSONField(default=dict)
    generado_por_ia = models.BooleanField(default=False)
    enviado_en      = models.DateTimeField()
    leido_en        = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['enviado_en']
