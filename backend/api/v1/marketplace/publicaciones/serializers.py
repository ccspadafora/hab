from __future__ import annotations

from rest_framework import serializers

from apps.marketplace.publicaciones.models import PublicacionInmueble


class PublicacionListSerializer(serializers.ModelSerializer):
    """Used by propietario to see their own publications."""
    estado_label = serializers.SerializerMethodField()
    esta_verificada = serializers.BooleanField(read_only=True)
    puede_activarse = serializers.BooleanField(read_only=True)

    class Meta:
        model = PublicacionInmueble
        fields = [
            'id', 'titulo', 'tipo', 'barrio', 'localidad',
            'area_lote', 'estrato', 'anio_construccion',
            'fotos', 'estado', 'estado_label',
            'score_prefactibilidad', 'tags_prefact',
            'identidad_verificada', 'propiedad_verificada',
            'esta_verificada', 'puede_activarse',
            'publicado_en', 'updated_at',
        ]
        read_only_fields = [
            'score_prefactibilidad', 'tags_prefact',
            'visible_constructoras', 'estado', 'publicado_en',
        ]

    def get_estado_label(self, obj: PublicacionInmueble) -> str:
        return obj.get_estado_display()


class PublicacionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicacionInmueble
        fields = [
            'titulo', 'tipo', 'direccion', 'barrio', 'localidad', 'ciudad',
            'latitud', 'longitud', 'area_lote', 'area_construida',
            'pisos', 'habitaciones', 'banos', 'estrato',
            'anio_construccion', 'estado_inmueble', 'descripcion',
            'precio_esperado', 'acepta_aporte', 'fotos', 'documentos',
        ]

    def create(self, validated_data):
        propietario = self.context['propietario']
        return PublicacionInmueble.objects.create(
            propietario=propietario,
            **validated_data,
        )


class PublicacionUpdateSerializer(serializers.ModelSerializer):
    """PATCH only allowed on borrador publications."""

    class Meta:
        model = PublicacionInmueble
        fields = [
            'titulo', 'tipo', 'direccion', 'barrio', 'localidad', 'ciudad',
            'latitud', 'longitud', 'area_lote', 'area_construida',
            'pisos', 'habitaciones', 'banos', 'estrato',
            'anio_construccion', 'estado_inmueble', 'descripcion',
            'precio_esperado', 'acepta_aporte', 'fotos', 'documentos',
        ]


class ProyectoCatalogoSerializer(serializers.ModelSerializer):
    """
    CRITICAL: Used by constructoras to browse the catalog.
    Must NEVER expose: direccion, propietario data, fotos reales, precio_esperado.
    """
    metricas_prefact = serializers.SerializerMethodField()
    en_negociacion_activa = serializers.SerializerMethodField()
    tipo_label = serializers.SerializerMethodField()

    class Meta:
        model = PublicacionInmueble
        fields = [
            'id', 'tipo', 'tipo_label',
            'barrio', 'localidad',
            'area_lote', 'estrato',
            'anio_construccion',
            'score_prefactibilidad',
            'tags_prefact',
            'metricas_prefact',
            'en_negociacion_activa',
            'publicado_en',
        ]

    def get_metricas_prefact(self, obj: PublicacionInmueble) -> dict:
        m = obj.metricas_prefact or {}
        return {
            'ingresos_brutos_est': m.get('ingresos_brutos_est'),
            'margen_bruto_est': m.get('margen_bruto_est'),
            'roi_est': m.get('roi_est'),
            'unidades_proyectadas': m.get('unidades_proyectadas'),
        }

    def get_en_negociacion_activa(self, obj: PublicacionInmueble) -> bool:
        return obj.estado == 'en_negociacion'

    def get_tipo_label(self, obj: PublicacionInmueble) -> str:
        return obj.get_tipo_display()
