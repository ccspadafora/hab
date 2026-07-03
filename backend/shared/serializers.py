from rest_framework import serializers
from .models import Nota


class NotaSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    entidad_tipo = serializers.SerializerMethodField()

    class Meta:
        model  = Nota
        fields = [
            'id', 'texto', 'tipo', 'es_fijada', 'adjuntos',
            'autor_nombre', 'entidad_tipo', 'creada_en', 'actualizada_en',
        ]
        read_only_fields = ['id', 'creada_en', 'actualizada_en', 'autor_nombre', 'entidad_tipo']

    def get_autor_nombre(self, obj):
        return obj.autor.get_full_name() if obj.autor else 'Sistema'

    def get_entidad_tipo(self, obj):
        return obj.content_type.model
