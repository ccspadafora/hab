from rest_framework import serializers
from .models import ConfiguracionSistema, ConfiguracionScraping, ConfiguracionIA


class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    actualizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = ConfiguracionSistema
        fields = [
            'id', 'clave', 'valor', 'tipo', 'descripcion',
            'categoria', 'editable_frontend',
            'actualizado_por', 'actualizado_por_nombre', 'actualizado_en',
        ]
        read_only_fields = ['id', 'actualizado_en', 'actualizado_por_nombre']

    def get_actualizado_por_nombre(self, obj):
        return obj.actualizado_por.get_full_name() if obj.actualizado_por else None


class ConfiguracionScrapingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ConfiguracionScraping
        fields = '__all__'


class ConfiguracionIASerializer(serializers.ModelSerializer):
    class Meta:
        model  = ConfiguracionIA
        fields = '__all__'
        read_only_fields = ['id', 'actualizado_en']
