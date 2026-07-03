from rest_framework import serializers
from .models import BaseConocimientoIA, PromptIA, ConfiguracionAgente


class BaseConocimientoIASerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = BaseConocimientoIA
        fields = [
            'id', 'nombre', 'tipo', 'descripcion', 'aplica_a',
            'texto_plano', 'archivo', 'archivo_tipo',
            'contenido_extraido', 'activo',
            'creado_por', 'creado_por_nombre',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'contenido_extraido', 'creado_en', 'actualizado_en', 'creado_por_nombre']

    def get_creado_por_nombre(self, obj):
        return obj.creado_por.get_full_name() if obj.creado_por else None


class ConfiguracionAgenteSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = ConfiguracionAgente
        fields = '__all__'
        read_only_fields = ['id', 'creado_en', 'actualizado_en', 'creado_por_nombre']

    def get_creado_por_nombre(self, obj):
        return obj.creado_por.get_full_name() if obj.creado_por else None


class PromptIASerializer(serializers.ModelSerializer):
    actualizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = PromptIA
        fields = [
            'id', 'nombre', 'modulo', 'activo', 'version',
            'prompt_sistema', 'prompt_usuario', 'variables_disponibles',
            'actualizado_por', 'actualizado_por_nombre', 'actualizado_en',
        ]
        read_only_fields = ['id', 'version', 'actualizado_en', 'actualizado_por_nombre']

    def get_actualizado_por_nombre(self, obj):
        return obj.actualizado_por.get_full_name() if obj.actualizado_por else None
