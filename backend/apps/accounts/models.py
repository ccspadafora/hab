from django.contrib.auth.models import AbstractUser
from django.db import models

ROLE_CHOICES = [
    ('superadmin',    'Super Administrador'),
    ('admin',         'Administrador'),
    ('administrativo','Administrativo'),
    ('finanzas',      'Finanzas'),
    ('estructuracion','Estructuración'),
    ('comercial',     'Comercial'),
    # Legacy (mantener compatibilidad)
    ('analista',      'Analista'),
    ('asesor',        'Asesor'),
    ('gerente',       'Gerente'),
    ('constructora',  'Constructora'),
]

MODULO_CHOICES = [
    ('dashboard',      'Dashboard general'),
    ('financiero',     'Dashboard financiero'),
    ('predios',        'Predios / Scraping'),
    ('viabilidad',     'Análisis de viabilidad'),
    ('propietarios',   'Propietarios CRM'),
    ('leads',          'Leads CRM'),
    ('calendario',     'Calendario de citas'),
    ('bot',            'WhatsApp Bot'),
    ('proyectos',      'Proyectos'),
    ('estructuracion', 'Estructuración financiera'),
    ('ia',             'Inteligencia Artificial'),
    ('configuracion',  'Configuración'),
    ('usuarios',       'Gestión de usuarios'),
]

PERMISOS_DEFAULT: dict[str, dict[str, tuple[bool, bool]]] = {
    # role: { modulo: (puede_ver, puede_editar) }
    'superadmin': {m[0]: (True, True)  for m in MODULO_CHOICES},
    'admin':      {m[0]: (True, True)  for m in MODULO_CHOICES},
    'administrativo': {
        'dashboard': (True, False), 'predios': (True, False),
        'propietarios': (True, False), 'leads': (True, False),
        'calendario': (True, True), 'bot': (True, False),
        'financiero': (False, False), 'viabilidad': (False, False),
        'proyectos': (True, False), 'estructuracion': (False, False),
        'ia': (False, False), 'configuracion': (False, False), 'usuarios': (False, False),
    },
    'finanzas': {
        'dashboard': (True, False), 'financiero': (True, True),
        'proyectos': (True, False), 'estructuracion': (True, True),
        'predios': (True, False), 'viabilidad': (True, False),
        'propietarios': (False, False), 'leads': (False, False),
        'calendario': (False, False), 'bot': (False, False),
        'ia': (False, False), 'configuracion': (False, False), 'usuarios': (False, False),
    },
    'estructuracion': {
        'dashboard': (True, False), 'predios': (True, False),
        'viabilidad': (True, True), 'proyectos': (True, True),
        'estructuracion': (True, True), 'ia': (True, True),
        'financiero': (True, False),
        'propietarios': (True, False), 'leads': (False, False),
        'calendario': (False, False), 'bot': (False, False),
        'configuracion': (False, False), 'usuarios': (False, False),
    },
    'comercial': {
        'dashboard': (True, False), 'predios': (True, False),
        'propietarios': (True, True), 'leads': (True, True),
        'calendario': (True, True), 'bot': (True, True),
        'proyectos': (True, False),
        'financiero': (False, False), 'viabilidad': (False, False),
        'estructuracion': (False, False), 'ia': (False, False),
        'configuracion': (False, False), 'usuarios': (False, False),
    },
}


class User(AbstractUser):
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='asesor')
    phone      = models.CharField(max_length=20, blank=True)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.get_full_name()} ({self.role})'


class PermisoModulo(models.Model):
    """Permiso por rol x módulo — configurable desde el panel."""
    role       = models.CharField(max_length=30, choices=ROLE_CHOICES)
    modulo     = models.CharField(max_length=30, choices=MODULO_CHOICES)
    puede_ver  = models.BooleanField(default=False)
    puede_editar = models.BooleanField(default=False)

    class Meta:
        unique_together = [['role', 'modulo']]
        verbose_name = 'Permiso de módulo'
        ordering = ['role', 'modulo']

    def __str__(self):
        return f'{self.role} → {self.modulo} (ver={self.puede_ver}, editar={self.puede_editar})'

    @classmethod
    def seed_defaults(cls):
        """Pobla los permisos por defecto para todos los roles estándar."""
        for role, modulos in PERMISOS_DEFAULT.items():
            for modulo, (ver, editar) in modulos.items():
                cls.objects.get_or_create(
                    role=role, modulo=modulo,
                    defaults={'puede_ver': ver, 'puede_editar': editar},
                )

    @classmethod
    def para_role(cls, role: str) -> dict:
        """Retorna dict {modulo: {ver, editar}} para un rol."""
        permisos = cls.objects.filter(role=role)
        return {p.modulo: {'ver': p.puede_ver, 'editar': p.puede_editar} for p in permisos}


class Constructora(models.Model):
    name          = models.CharField(max_length=200)
    nit           = models.CharField(max_length=20, unique=True)
    contact_name  = models.CharField(max_length=200)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    user          = models.OneToOneField(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='constructora',
    )
    active     = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Constructora'
        verbose_name_plural = 'Constructoras'

    def __str__(self):
        return self.name
