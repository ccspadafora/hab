from __future__ import annotations

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    constructora_id: int
    score: float
    razones: list[str]


class MatchingEngine:
    """
    Compares an active PublicacionInmueble against all certified constructoras
    and creates Match records for compatible ones.
    Score >= 60 → create match and notify.
    """

    SCORE_MINIMO_NOTIFICAR = 60

    def run(self, publicacion_id: int):
        from apps.marketplace.publicaciones.models import PublicacionInmueble
        from apps.marketplace.perfiles_constructora.models import PerfilConstructoraMP
        from apps.marketplace.matching.models import Match

        pub = PublicacionInmueble.objects.get(pk=publicacion_id)
        constructoras = PerfilConstructoraMP.objects.filter(
            estado_certificacion='certificada'
        )

        created_matches = []
        for constructora in constructoras:
            result = self._score_match(pub, constructora)
            if result.score < self.SCORE_MINIMO_NOTIFICAR:
                continue

            match, created = Match.objects.get_or_create(
                publicacion=pub,
                constructora=constructora,
                defaults={
                    'score_match': result.score,
                    'origen': 'automatico',
                    'estado': 'sugerido',
                    'nota_interna': ', '.join(result.razones),
                },
            )
            if created:
                created_matches.append(match)
                logger.info(
                    'matching.match_created',
                    extra={
                        'publicacion_id': publicacion_id,
                        'constructora_id': constructora.pk,
                        'score': result.score,
                    },
                )

        return created_matches

    def _score_match(self, pub: object, constructora: object) -> MatchResult:
        score = 0.0
        razones: list[str] = []

        zonas = constructora.zonas_interes or []
        if pub.barrio in zonas or pub.localidad in zonas:
            score += 40
            razones.append(f'Zona {pub.barrio} en zonas de interés')

        tipo_prefact = 'vis' if (pub.estrato or 0) <= 4 else 'no_vis'
        tipos = constructora.tipos_proyecto or []
        if tipo_prefact in tipos or 'mixto' in tipos:
            score += 25
            razones.append(f'Tipo {tipo_prefact} compatible')

        metricas = pub.metricas_prefact or {}
        inversion_est = float(metricas.get('costo_total_est', 0) or 0)
        inv_min = float(constructora.inversion_min or 0)
        inv_max = float(constructora.inversion_max or float('inf'))
        if inversion_est == 0 or inv_min <= inversion_est <= inv_max:
            score += 20
            razones.append('Inversión en rango')

        if constructora.nivel_certificacion == 'premium':
            score += 15
            razones.append('Constructora premium — acceso prioritario')

        return MatchResult(
            constructora_id=constructora.pk,
            score=min(score, 100),
            razones=razones,
        )
