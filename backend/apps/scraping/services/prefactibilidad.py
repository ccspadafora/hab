from dataclasses import dataclass
from typing import List
from apps.scraping.models import ZonaPOT


@dataclass
class PrefactibilidadResult:
    score:          float
    tags:           List[str]
    metricas:       dict
    detalle_scores: dict


class PrefactibilidadEngine:
    """
    Calcula el score de prefactibilidad (0-100) de un predio recién scrapeado.
    Se ejecuta desde la task asíncrona tras cada scraping.
    """

    PESOS = {
        'area_lote':         0.20,
        'zona_pot':          0.25,
        'precio_vs_mercado': 0.20,
        'estrato':           0.10,
        'ubicacion':         0.15,
        'estado_inmueble':   0.10,
    }

    PRECIO_M2_DEFAULT_POR_BARRIO = {
        'chapinero': 8_500_000,
        'usaquen':   9_200_000,
        'suba':      5_800_000,
        'kennedy':   4_200_000,
        'default':   6_000_000,
    }

    def calcular(self, predio) -> PrefactibilidadResult:
        scores = {
            'area_lote':         self._score_area(predio),
            'zona_pot':          self._score_zona_pot(predio),
            'precio_vs_mercado': self._score_precio(predio),
            'estrato':           self._score_estrato(predio),
            'ubicacion':         0.5,  # placeholder — integrar con API de ubicación
            'estado_inmueble':   self._score_estado_inmueble(predio),
        }
        score_total = sum(scores[k] * self.PESOS[k] for k in scores) * 100
        tags     = self._generar_tags(predio, scores, score_total)
        metricas = self._calcular_metricas(predio)
        return PrefactibilidadResult(
            score=round(score_total, 1),
            tags=tags,
            metricas=metricas,
            detalle_scores={k: round(v, 3) for k, v in scores.items()},
        )

    def _score_area(self, predio) -> float:
        area = float(predio.area_lote or 0)
        if area >= 300: return 1.0
        if area >= 200: return 0.8
        if area >= 120: return 0.6
        if area >= 80:  return 0.4
        return 0.2

    def _score_zona_pot(self, predio) -> float:
        zona = ZonaPOT.objects.filter(barrio__icontains=predio.barrio).first()
        if not zona:
            return 0.5
        return min(float(zona.indice_construccion) / 5.0, 1.0)

    def _score_precio(self, predio) -> float:
        if not predio.precio_m2:
            return 0.5
        mediana = self._precio_m2_zona(predio.barrio)
        ratio = float(predio.precio_m2) / mediana
        if ratio <= 0.70: return 1.0
        if ratio <= 0.85: return 0.75
        if ratio <= 1.00: return 0.50
        if ratio <= 1.15: return 0.25
        return 0.10

    def _score_estrato(self, predio) -> float:
        mapping = {1: 0.2, 2: 0.3, 3: 0.6, 4: 1.0, 5: 1.0, 6: 0.7}
        return mapping.get(predio.estrato, 0.5)

    def _score_estado_inmueble(self, predio) -> float:
        if predio.anio_construccion and predio.anio_construccion <= 1990:
            return 1.0
        if predio.anio_construccion and predio.anio_construccion <= 2005:
            return 0.7
        return 0.4

    def _precio_m2_zona(self, barrio: str) -> float:
        barrio_lower = (barrio or '').lower()
        for key, precio in self.PRECIO_M2_DEFAULT_POR_BARRIO.items():
            if key in barrio_lower:
                return precio
        return self.PRECIO_M2_DEFAULT_POR_BARRIO['default']

    def _calcular_metricas(self, predio) -> dict:
        area            = float(predio.area_lote or 0)
        area_edificable = area * 2.0
        area_vendible   = area_edificable * 0.85
        precio_m2_nuevo = self._precio_m2_zona(predio.barrio)
        ingresos_brutos = area_vendible * precio_m2_nuevo
        costo_const     = area_edificable * 1_800_000
        costo_terreno   = float(predio.precio_publicado or 0)
        costo_total     = costo_const + costo_terreno
        utilidad_bruta  = ingresos_brutos - costo_total
        margen = (utilidad_bruta / ingresos_brutos * 100) if ingresos_brutos else 0
        roi    = (utilidad_bruta / costo_total * 100) if costo_total else 0
        return {
            'area_edificable_est':  round(area_edificable, 0),
            'ingresos_brutos_est':  round(ingresos_brutos, 0),
            'costo_total_est':      round(costo_total, 0),
            'utilidad_bruta_est':   round(utilidad_bruta, 0),
            'margen_bruto_est':     round(margen, 1),
            'roi_est':              round(roi, 1),
            'valor_max_predio_est': round(costo_total * 0.35, 0),
        }

    def _generar_tags(self, predio, scores: dict, score_total: float) -> list:
        tags = []
        if score_total >= 70:   tags.append('alta_prioridad')
        elif score_total >= 50: tags.append('media_prioridad')
        else:                   tags.append('baja_prioridad')

        area = float(predio.area_lote or 0)
        if area >= 200: tags.append('lote_grande')
        if area >= 300: tags.append('consolidacion_posible')

        if predio.anio_construccion and predio.anio_construccion <= 1990:
            tags.append('inmueble_antiguo')
        if scores['precio_vs_mercado'] >= 0.75:
            tags.append('precio_favorable')
        if scores['zona_pot'] >= 0.75:
            tags.append('zona_densificacion')
        if predio.estrato in [4, 5]:
            tags.append('estrato_objetivo')
        return tags
