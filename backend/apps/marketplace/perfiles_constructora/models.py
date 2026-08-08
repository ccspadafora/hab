from __future__ import annotations

from django.db import models

from .managers import PerfilConstructoraMPManager


ESTADO_CERTIFICACION_CHOICES = [
    ('pendiente',   'Solicitud pendiente'),
    ('en_revision', 'En revisión por HAB'),
    ('certificada', 'Certificada por HAB'),
    ('suspendida',  'Suspendida'),
    ('rechazada',   'Rechazada'),
]

NIVEL_CERTIFICACION_CHOICES = [
    ('basico',     'Básico'),
    ('verificado', 'Verificado'),
    ('premium',    'Premium'),
]


class PerfilConstructoraMP(models.Model):
    """
    Perfil público y certificación de una constructora en el marketplace.
    HAB analiza y certifica antes de dar acceso.
    """
    constructora = models.OneToOneField(
        'accounts.Constructora',
        on_delete=models.CASCADE,
        related_name='perfil_marketplace',
    )
    nombre_comercial = models.CharField(max_length=200)
    nit = models.CharField(max_length=20, unique=True)
    logo_url = models.URLField(blank=True)
    descripcion = models.TextField()
    anio_fundacion = models.IntegerField(null=True, blank=True)
    sitio_web = models.URLField(blank=True)
    estado_certificacion = models.CharField(
        max_length=20,
        choices=ESTADO_CERTIFICACION_CHOICES,
        default='pendiente',
        db_index=True,
    )
    nivel_certificacion = models.CharField(
        max_length=20,
        choices=NIVEL_CERTIFICACION_CHOICES,
        null=True,
        blank=True,
    )
    certificada_en = models.DateTimeField(null=True, blank=True)
    vence_certificacion = models.DateField(null=True, blank=True)
    certificada_por = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='constructoras_certificadas',
    )
    notas_certificacion = models.TextField(blank=True)
    zonas_interes = models.JSONField(default=list, blank=True)
    tipos_proyecto = models.JSONField(default=list, blank=True)
    inversion_min = models.DecimalField(
        max_digits=25, decimal_places=2, null=True, blank=True,
    )
    inversion_max = models.DecimalField(
        max_digits=25, decimal_places=2, null=True, blank=True,
    )
    unidades_min = models.IntegerField(null=True, blank=True)
    unidades_max = models.IntegerField(null=True, blank=True)
    proyectos_ejecutados = models.IntegerField(default=0)
    m2_construidos = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    referencias = models.JSONField(default=list, blank=True)
    documentos_certificacion = models.JSONField(default=list, blank=True)
    total_intereses_expresados = models.IntegerField(default=0)
    total_negociaciones = models.IntegerField(default=0)
    total_cierres = models.IntegerField(default=0)
    tasa_cierre = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PerfilConstructoraMPManager()

    class Meta:
        verbose_name = 'Perfil constructora marketplace'
        verbose_name_plural = 'Perfiles constructoras marketplace'
        indexes = [
            models.Index(fields=['estado_certificacion']),
            models.Index(fields=['vence_certificacion']),
        ]

    def __str__(self) -> str:
        return f'PerfilMP({self.nombre_comercial} · {self.estado_certificacion})'

    @property
    def esta_activa(self) -> bool:
        return self.estado_certificacion == 'certificada'


class SolicitudCertificacionConstructora(models.Model):
    """
    Solicitud de acceso al marketplace. HAB la revisa y aprueba o rechaza.
    """
    nombre_empresa = models.CharField(max_length=200)
    nit = models.CharField(max_length=20)
    contacto_nombre = models.CharField(max_length=200)
    contacto_email = models.EmailField()
    contacto_cargo = models.CharField(max_length=100)
    contacto_telefono = models.CharField(max_length=20)
    descripcion_empresa = models.TextField()
    anios_experiencia = models.IntegerField()
    proyectos_ejecutados = models.IntegerField()
    zonas_interes = models.JSONField(default=list, blank=True)
    tipos_proyecto = models.JSONField(default=list, blank=True)
    inversion_disponible = models.DecimalField(
        max_digits=25, decimal_places=2, null=True, blank=True,
    )
    documentos = models.JSONField(default=list, blank=True)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('recibida',       'Solicitud recibida'),
            ('en_revision',    'En revisión'),
            ('docs_faltantes', 'Documentos faltantes'),
            ('aprobada',       'Aprobada'),
            ('rechazada',      'Rechazada'),
        ],
        default='recibida',
    )
    revisada_por = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='solicitudes_certificacion_revisadas',
    )
    notas_revision = models.TextField(blank=True)
    documentos_faltantes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Solicitud de certificación'
        verbose_name_plural = 'Solicitudes de certificación'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Solicitud({self.nombre_empresa} · {self.estado})'
