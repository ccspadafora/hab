from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from typing import Any

from apps.scraping.services.prefactibilidad import PrefactibilidadEngine, PrefactibilidadResult


@dataclass
class PublicacionPrefactResult:
    score: float
    tags: list[str]
    metricas: dict
    detalle_scores: dict


class PublicacionPrefactService:
    """
    Adapts PrefactibilidadEngine (designed for Predio) to PublicacionInmueble.
    Maps precio_esperado/area → precio_m2 / precio_publicado.
    """

    def __init__(self, engine: PrefactibilidadEngine | None = None) -> None:
        self.engine = engine or PrefactibilidadEngine()

    def calcular(self, publicacion: Any) -> PublicacionPrefactResult:
        predio_like = self._as_predio_like(publicacion)
        result: PrefactibilidadResult = self.engine.calcular(predio_like)
        metricas = dict(result.metricas)
        if 'unidades_proyectadas' not in metricas:
            area = float(getattr(publicacion, 'area_lote', 0) or 0)
            metricas['unidades_proyectadas'] = max(int(area * 2.0 * 0.85 / 55), 1)
        return PublicacionPrefactResult(
            score=result.score,
            tags=result.tags,
            metricas=metricas,
            detalle_scores=result.detalle_scores,
        )

    def _as_predio_like(self, pub: Any) -> SimpleNamespace:
        area = float(getattr(pub, 'area_lote', 0) or 0)
        precio = getattr(pub, 'precio_esperado', None)
        precio_publicado = float(precio) if precio is not None else 0.0
        precio_m2 = (precio_publicado / area) if area > 0 and precio_publicado > 0 else None
        return SimpleNamespace(
            area_lote=area,
            barrio=getattr(pub, 'barrio', '') or '',
            estrato=getattr(pub, 'estrato', None),
            anio_construccion=getattr(pub, 'anio_construccion', None),
            precio_publicado=precio_publicado or None,
            precio_m2=precio_m2,
        )
