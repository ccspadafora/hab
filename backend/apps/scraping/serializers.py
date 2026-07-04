from rest_framework import serializers
from .models import FuenteScraping, ZonaPOT, Predio, EjecucionScraping


class FuenteScrapingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FuenteScraping
        fields = '__all__'


class ZonaPOTSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ZonaPOT
        fields = '__all__'


class PredioListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados y pipeline."""
    class Meta:
        model  = Predio
        fields = [
            'id', 'fuente', 'url_origen', 'codigo_externo',
            'barrio', 'localidad', 'ciudad', 'direccion',
            'tipo', 'area_lote', 'estrato', 'precio_publicado', 'precio_m2',
            'estado', 'score_prefactibilidad', 'tags', 'tags_manuales', 'imagenes',
            'primera_deteccion', 'ultima_actualizacion',
        ]


class PredioDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo para vista detalle."""
    class Meta:
        model  = Predio
        fields = '__all__'


class PredioCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/editar predios manualmente desde el panel.
    Incluye todos los campos necesarios: fuente, url_origen, etc.
    """
    class Meta:
        model  = Predio
        fields = [
            'id', 'fuente', 'url_origen', 'codigo_externo',
            'barrio', 'localidad', 'ciudad', 'direccion',
            'tipo', 'area_lote', 'area_construida', 'estrato',
            'pisos', 'anio_construccion',
            'precio_publicado', 'precio_m2', 'estado',
            'descripcion_raw',
            'primera_deteccion', 'ultima_actualizacion',
        ]
        read_only_fields = ['id', 'primera_deteccion', 'ultima_actualizacion']

    def validate(self, data):
        # Calcular precio_m2 automáticamente si no se provee
        precio = data.get('precio_publicado')
        area   = data.get('area_lote')
        if precio and area and not data.get('precio_m2'):
            data['precio_m2'] = round(float(precio) / float(area), 2)
        # url_origen por defecto
        if not data.get('url_origen'):
            barrio = data.get('barrio', 'manual')
            import uuid
            data['url_origen'] = f'https://hab.com.co/manual/{barrio.lower().replace(" ","-")}/{uuid.uuid4().hex[:8]}'
        return data


class EjecucionScrapingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EjecucionScraping
        fields = '__all__'
        read_only_fields = ['id', 'inicio', 'fin', 'predios_encontrados',
                            'predios_nuevos', 'errores', 'log']
