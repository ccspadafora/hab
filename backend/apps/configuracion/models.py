from django.db import models


class ConfiguracionSistema(models.Model):
    TIPO_CHOICES = [
        ('string',  'Texto'),
        ('integer', 'Entero'),
        ('boolean', 'Booleano'),
        ('json',    'JSON'),
        ('secret',  'Secreto'),
    ]
    CATEGORIA_CHOICES = [
        ('scraping',        'Scraping'),
        ('ia',              'IA'),
        ('whatsapp',        'WhatsApp'),
        ('notificaciones',  'Notificaciones'),
        ('general',         'General'),
    ]

    clave             = models.CharField(max_length=100, unique=True)
    valor             = models.JSONField()
    tipo              = models.CharField(max_length=20, choices=TIPO_CHOICES, default='string')
    descripcion       = models.TextField()
    categoria         = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='general')
    editable_frontend = models.BooleanField(default=True)
    actualizado_por   = models.ForeignKey(
        'accounts.User', null=True, blank=True, on_delete=models.SET_NULL
    )
    actualizado_en    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['categoria', 'clave']
        verbose_name = 'Configuración del sistema'
        verbose_name_plural = 'Configuraciones del sistema'

    def __str__(self):
        return f'{self.categoria}.{self.clave}'


class ConfiguracionScraping(models.Model):
    """Configuración avanzada por fuente de scraping."""
    fuente = models.OneToOneField(
        'scraping.FuenteScraping',
        on_delete=models.CASCADE,
        related_name='configuracion_avanzada',
    )
    ciudades            = models.JSONField(default=list)
    barrios_objetivo    = models.JSONField(default=list)
    localidades         = models.JSONField(default=list)
    tipos_predio        = models.JSONField(default=list)
    estrato_min         = models.IntegerField(default=3)
    estrato_max         = models.IntegerField(default=6)
    precio_min          = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    precio_max          = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    area_lote_min       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    frecuencia_cron     = models.CharField(max_length=50, default='0 6 * * *')
    max_paginas         = models.IntegerField(default=20)
    delay_entre_paginas = models.IntegerField(default=3)
    umbral_score_auto_viable   = models.IntegerField(default=65)
    umbral_score_auto_noviable = models.IntegerField(default=30)

    class Meta:
        verbose_name = 'Configuración de scraping'

    def __str__(self):
        return f'Config scraping — {self.fuente}'


class ConfiguracionIA(models.Model):
    """Singleton — siempre una sola fila. Controla modelos y comportamiento IA."""
    modelo_estructuracion      = models.CharField(max_length=100, default='gpt-4o')
    modelo_bot_whatsapp        = models.CharField(max_length=100, default='gpt-4o')
    modelo_scoring             = models.CharField(max_length=100, default='gpt-4o-mini')
    temperatura_bot            = models.DecimalField(max_digits=3, decimal_places=2, default=0.7)
    temperatura_estructuracion = models.DecimalField(max_digits=3, decimal_places=2, default=0.3)
    max_tokens_respuesta_bot   = models.IntegerField(default=500)
    max_tokens_estructuracion  = models.IntegerField(default=4000)
    ia_bot_activa_global       = models.BooleanField(default=True)
    escalar_tras_n_mensajes    = models.IntegerField(default=15)
    actualizado_en             = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración IA'

    def __str__(self):
        return f'ConfiguracionIA (bot={self.modelo_bot_whatsapp})'

    @classmethod
    def get(cls):
        """Acceso singleton seguro."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
