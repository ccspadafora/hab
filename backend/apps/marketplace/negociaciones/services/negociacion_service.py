from __future__ import annotations

from django.utils import timezone


class NegociacionService:
    """Operaciones de dominio sobre Negociacion + EventoNegociacion."""

    def iniciar(self, match, asesor_hab):
        from apps.marketplace.negociaciones.models import Negociacion, EventoNegociacion
        from apps.marketplace.matching.models import Match

        negociacion, created = Negociacion.objects.get_or_create(
            match=match,
            defaults={'asesor_hab': asesor_hab, 'fase': 'inicio'},
        )
        if created:
            Match.objects.filter(pk=match.pk).update(estado='en_negociacion')
            EventoNegociacion.objects.create(
                negociacion=negociacion,
                actor='hab',
                tipo='inicio',
                descripcion='Negociación iniciada',
                usuario=asesor_hab,
            )
        return negociacion

    def avanzar_fase(self, negociacion, nueva_fase: str, usuario=None, descripcion: str = ''):
        from apps.marketplace.negociaciones.models import EventoNegociacion

        anterior = negociacion.fase
        negociacion.fase = nueva_fase
        if nueva_fase in ('cerrada_exitosa', 'cerrada_sin_exito'):
            negociacion.cerrada_en = timezone.now()
        negociacion.save()
        EventoNegociacion.objects.create(
            negociacion=negociacion,
            actor='hab' if usuario else 'sistema',
            tipo='cambio_fase',
            descripcion=descripcion or f'{anterior} → {nueva_fase}',
            datos={'desde': anterior, 'hacia': nueva_fase},
            usuario=usuario,
        )
        return negociacion
