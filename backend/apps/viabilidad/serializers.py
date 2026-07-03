from rest_framework import serializers
from .models import AnalisisViabilidad


class AnalisisViabilidadSerializer(serializers.ModelSerializer):
    predio_info  = serializers.SerializerMethodField()
    analista_nombre = serializers.SerializerMethodField()

    class Meta:
        model  = AnalisisViabilidad
        fields = [
            'id', 'predio', 'predio_info', 'analista', 'analista_nombre',
            # POT
            'zona_pot', 'indice_construccion', 'indice_ocupacion',
            'altura_max_pisos', 'uso_suelo', 'densidad_max_uds',
            # Financiero
            'area_edificable', 'unidades_proyectadas', 'precio_m2_nuevo',
            'valor_bruto_proyecto', 'costo_construccion', 'valor_max_predio',
            'utilidad_estimada', 'margen_estimado',
            # Resultado
            'es_viable', 'razon_no_viabilidad', 'score_viabilidad',
            'justificacion_ia', 'notas',
            'solicitado_en', 'completado_en',
        ]
        read_only_fields = [
            'id', 'solicitado_en', 'completado_en',
            'predio_info', 'analista_nombre',
            'zona_pot', 'indice_construccion', 'indice_ocupacion',
            'altura_max_pisos', 'uso_suelo', 'area_edificable',
            'unidades_proyectadas', 'score_viabilidad', 'justificacion_ia',
        ]

    def get_predio_info(self, obj):
        return {
            'id':      obj.predio.pk,
            'barrio':  obj.predio.barrio,
            'tipo':    obj.predio.tipo,
            'area':    str(obj.predio.area_lote or ''),
            'estado':  obj.predio.estado,
            'score':   str(obj.predio.score_prefactibilidad or ''),
        }

    def get_analista_nombre(self, obj):
        return obj.analista.get_full_name() if obj.analista else None
