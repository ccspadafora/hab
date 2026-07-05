from rest_framework import serializers
from .models import Propietario, PropietarioPredio, Lead, InteraccionLead, Cita


class PropietarioSerializer(serializers.ModelSerializer):
    asesor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Propietario
        fields = [
            'id', 'nombre', 'tipo', 'cedula_nit',
            'telefono_principal', 'telefono_secundario', 'email', 'whatsapp_phone',
            'ciudad', 'direccion_residencia',
            'asesor_asignado', 'asesor_nombre',
            'estado_contacto', 'temperatura', 'fuente_origen', 'etiquetas',
            'primer_contacto', 'ultimo_contacto', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'asesor_nombre']

    def get_asesor_nombre(self, obj):
        return obj.asesor_asignado.get_full_name() if obj.asesor_asignado else None


class PropietarioPredioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PropietarioPredio
        fields = '__all__'


class InteraccionLeadSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = InteraccionLead
        fields = ['id', 'tipo', 'descripcion', 'resultado', 'usuario_nombre', 'creado_en']
        read_only_fields = ['id', 'creado_en', 'usuario_nombre']

    def get_usuario_nombre(self, obj):
        return obj.usuario.get_full_name() if obj.usuario else 'Sistema'


class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Cita
        fields = '__all__'
        read_only_fields = ['id', 'creado_en', 'lead', 'asesor']

    def validate(self, attrs):
        modalidad = attrs.get('modalidad')
        ubicacion = (attrs.get('ubicacion') or '').strip()
        url_meet = (attrs.get('url_meet') or '').strip()

        if modalidad == 'presencial' and not ubicacion:
            raise serializers.ValidationError({'ubicacion': ['La ubicación es requerida para citas presenciales.']})
        if modalidad == 'videollamada' and not url_meet:
            raise serializers.ValidationError({'url_meet': ['La URL de la reunión es requerida para videollamadas.']})
        return attrs


class LeadSerializer(serializers.ModelSerializer):
    asesor_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = Lead
        fields = [
            'id', 'nombre', 'telefono', 'email', 'cedula',
            'predio', 'propietario', 'asesor', 'asesor_nombre',
            'estado', 'temperatura', 'fuente_origen',
            'primer_contacto', 'ultimo_contacto', 'proxima_accion', 'nota_proxima_accion',
            'notas', 'etiquetas', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'asesor_nombre']

    def get_asesor_nombre(self, obj):
        return obj.asesor.get_full_name() if obj.asesor else None


class LeadDetalleSerializer(LeadSerializer):
    interacciones = InteraccionLeadSerializer(many=True, read_only=True)
    citas         = CitaSerializer(many=True, read_only=True)

    class Meta(LeadSerializer.Meta):
        fields = LeadSerializer.Meta.fields + ['interacciones', 'citas']
