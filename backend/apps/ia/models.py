from django.db import models


class BaseConocimientoIA(models.Model):
    TIPO_CHOICES = [
        ('norma',            'Norma'),
        ('ejemplo_proyecto', 'Ejemplo de proyecto'),
        ('instruccion',      'Instrucción'),
        ('tabla_precios',    'Tabla de precios'),
        ('otro',             'Otro'),
    ]
    APLICA_A_CHOICES = [
        ('estructuracion', 'Estructuración'),
        ('scoring',        'Scoring'),
        ('bot',            'Bot'),
        ('todos',          'Todos'),
    ]

    nombre             = models.CharField(max_length=200)
    tipo               = models.CharField(max_length=30, choices=TIPO_CHOICES, default='instruccion')
    descripcion        = models.TextField(blank=True)
    texto_plano        = models.TextField(blank=True)
    archivo            = models.FileField(upload_to='ia/knowledge/', null=True, blank=True)
    archivo_tipo       = models.CharField(max_length=20, blank=True)
    contenido_extraido = models.TextField(blank=True)
    activo             = models.BooleanField(default=True)
    aplica_a           = models.CharField(max_length=20, choices=APLICA_A_CHOICES, default='todos')
    embedding_cache    = models.TextField(blank=True, default='',
                         help_text='Cache JSON de embeddings RAG para búsqueda semántica')
    creado_por         = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    creado_en          = models.DateTimeField(auto_now_add=True)
    actualizado_en     = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Base de conocimiento IA'
        ordering = ['-creado_en']

    def __str__(self):
        return f'[{self.tipo}] {self.nombre}'


class ConfiguracionAgente(models.Model):
    """Configuración de un agente IA independiente (soporte multi-agente)."""
    MODULO_CHOICES = [
        ('bot_whatsapp',   'Bot WhatsApp'),
        ('scoring',        'Scoring de predios'),
        ('estructuracion', 'Estructuración financiera'),
        ('prefactibilidad','Prefactibilidad'),
    ]
    nombre       = models.CharField(max_length=100, unique=True)
    modulo       = models.CharField(max_length=30, choices=MODULO_CHOICES)
    descripcion  = models.TextField(blank=True)
    modelo_ia    = models.CharField(max_length=100, default='gpt-4o')
    temperatura  = models.DecimalField(max_digits=3, decimal_places=2, default=0.7)
    max_tokens   = models.IntegerField(default=500)
    activo       = models.BooleanField(default=True)
    es_principal = models.BooleanField(default=False,
                   help_text='Solo un agente por módulo puede ser principal')
    instrucciones_extra = models.TextField(blank=True,
                          help_text='Instrucciones adicionales que se añaden al prompt base')
    creado_por   = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    creado_en    = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración de agente'
        ordering = ['modulo', 'nombre']

    def __str__(self):
        return f'{self.nombre} ({self.modulo})'


class PromptIA(models.Model):
    MODULO_CHOICES = [
        ('estructuracion',   'Estructuración'),
        ('scoring',          'Scoring'),
        ('bot_inicio',       'Bot — inicio'),
        ('bot_presentacion', 'Bot — presentación'),
        ('bot_objeciones',   'Bot — objeciones'),
        ('bot_agendamiento', 'Bot — agendamiento'),
        ('prefactibilidad',  'Prefactibilidad'),
    ]

    nombre                = models.CharField(max_length=100, unique=True)
    modulo                = models.CharField(max_length=30, choices=MODULO_CHOICES, unique=True)
    prompt_sistema        = models.TextField()
    prompt_usuario        = models.TextField()
    variables_disponibles = models.JSONField(default=list)
    activo                = models.BooleanField(default=True)
    version               = models.IntegerField(default=1)
    actualizado_por       = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    actualizado_en        = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Prompt IA'

    def __str__(self):
        return f'{self.nombre} (v{self.version})'
