from rest_framework import serializers
from .models import Conversacion, Mensaje


class MensajeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Mensaje
        fields = [
            'id', 'wa_message_id', 'direccion', 'tipo',
            'contenido', 'metadata', 'generado_por_ia',
            'enviado_en', 'leido_en',
        ]
        read_only_fields = ['id']


class ConversacionListSerializer(serializers.ModelSerializer):
    propietario_nombre = serializers.SerializerMethodField()
    ultimo_mensaje_texto = serializers.SerializerMethodField()
    mensajes_sin_leer  = serializers.SerializerMethodField()

    class Meta:
        model  = Conversacion
        fields = [
            'id', 'wa_contact_phone', 'estado', 'etapa_bot', 'ia_activa',
            'propietario', 'propietario_nombre',
            'ultimo_mensaje', 'ultimo_mensaje_texto', 'mensajes_sin_leer',
            'asignado_a', 'iniciado_en',
        ]

    def get_propietario_nombre(self, obj):
        return obj.propietario.nombre if obj.propietario else obj.wa_contact_phone

    def get_ultimo_mensaje_texto(self, obj):
        ultimo = obj.mensajes.last()
        return ultimo.contenido[:80] if ultimo else ''

    def get_mensajes_sin_leer(self, obj):
        return obj.mensajes.filter(direccion='entrante', leido_en__isnull=True).count()


class ConversacionDetalleSerializer(ConversacionListSerializer):
    mensajes = MensajeSerializer(many=True, read_only=True)

    class Meta(ConversacionListSerializer.Meta):
        fields = ConversacionListSerializer.Meta.fields + [
            'predio_contexto', 'contexto', 'ia_desactivada_por',
            'ia_desactivada_en', 'motivo_desactivacion', 'mensajes',
        ]
