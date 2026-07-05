from rest_framework import serializers
from django.utils.text import slugify
from .models import Proyecto, ProyectoPropietario, HitoProyecto, EstructuracionProyecto


class HitoProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HitoProyecto
        fields = '__all__'
        read_only_fields = ['id', 'creado_en']


class EstructuracionProyectoSerializer(serializers.ModelSerializer):
    generada_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = EstructuracionProyecto
        fields = '__all__'
        read_only_fields = ['id', 'version', 'creada_en', 'generada_por_nombre']

    def get_generada_por_nombre(self, obj):
        return obj.generada_por.get_full_name() if obj.generada_por else 'IA'


class ProyectoPropietarioSerializer(serializers.ModelSerializer):
    propietario_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = ProyectoPropietario
        fields = '__all__'

    def get_propietario_nombre(self, obj):
        return obj.propietario.nombre


class ProyectoListSerializer(serializers.ModelSerializer):
    gerente_nombre       = serializers.SerializerMethodField()
    estructuracion_vigente = serializers.SerializerMethodField()

    class Meta:
        model  = Proyecto
        fields = [
            'id', 'codigo', 'nombre', 'slug', 'fase',
            'gerente', 'gerente_nombre',
            'valor_total_estimado', 'fee_estructuracion',
            'ingresos_estructuracion_real', 'ingresos_gerencia_real', 'ingresos_ventas_real',
            'estructuracion_generada_en', 'presentacion_url',
            'fecha_estructuracion', 'fecha_presentacion',
            'fecha_inicio_obra', 'fecha_entrega_estimada',
            'estructuracion_vigente',
            'created_at', 'updated_at',
        ]

    def get_gerente_nombre(self, obj):
        return obj.gerente.get_full_name()

    def get_estructuracion_vigente(self, obj):
        est = obj.estructuraciones.filter(es_vigente=True).first()
        if not est:
            return None
        return {
            'id':            est.pk,
            'version':       est.version,
            'margen_neto':   str(est.margen_neto),
            'roi':           str(est.roi),
            'ingresos_brutos': str(est.ingresos_brutos),
            'costo_total':   str(est.costo_total),
            'generada_por_ia': est.generada_por_ia,
            'creada_en':     est.creada_en,
        }


class ProyectoDetalleSerializer(ProyectoListSerializer):
    hitos            = HitoProyectoSerializer(many=True, read_only=True)
    estructuraciones = EstructuracionProyectoSerializer(many=True, read_only=True)
    propietarios_detalle = ProyectoPropietarioSerializer(
        source='proyectopropietario_set', many=True, read_only=True
    )
    progreso = serializers.SerializerMethodField()

    class Meta(ProyectoListSerializer.Meta):
        fields = ProyectoListSerializer.Meta.fields + [
            'predio', 'analisis', 'predios_consolidados',
            'pct_gerencia', 'pct_ventas',
            'doc_estructuracion_url',
            'hitos', 'estructuraciones', 'propietarios_detalle', 'progreso',
        ]

    def get_progreso(self, obj):
        total = obj.hitos.count()
        if not total:
            return 0
        return round(obj.hitos.filter(completado=True).count() / total * 100)


class ProyectoWriteSerializer(serializers.ModelSerializer):
    slug = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Proyecto
        fields = [
            'id', 'predio', 'analisis', 'nombre', 'slug', 'codigo', 'fase', 'gerente',
            'fee_estructuracion', 'pct_gerencia', 'pct_ventas', 'valor_total_estimado',
            'presentacion_url', 'doc_estructuracion_url',
            'fecha_estructuracion', 'fecha_presentacion', 'fecha_inicio_obra', 'fecha_entrega_estimada',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'predio': {'required': True},
            'analisis': {'required': True},
            'nombre': {'required': True},
            'codigo': {'required': True},
            'gerente': {'required': True},
        }

    def validate_slug(self, value):
        return slugify(value) if value else value

    def validate(self, attrs):
        nombre = attrs.get('nombre') or getattr(self.instance, 'nombre', '')
        slug = attrs.get('slug') or slugify(nombre)
        attrs['slug'] = self._ensure_unique_slug(slug)
        return attrs

    def _ensure_unique_slug(self, base_slug: str) -> str:
        base_slug = base_slug or 'proyecto'
        candidate = base_slug
        qs = Proyecto.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        suffix = 2
        while qs.filter(slug=candidate).exists():
            candidate = f'{base_slug}-{suffix}'
            suffix += 1
        return candidate
