from __future__ import annotations

from django.utils import timezone


class CertificacionService:
    """Aprueba / rechaza solicitudes y actualiza PerfilConstructoraMP."""

    def aprobar(
        self,
        solicitud,
        revisada_por,
        nivel: str = 'basico',
        constructora=None,
    ):
        from apps.marketplace.perfiles_constructora.models import PerfilConstructoraMP

        solicitud.estado = 'aprobada'
        solicitud.revisada_por = revisada_por
        solicitud.save(update_fields=['estado', 'revisada_por', 'updated_at'])

        if constructora is None:
            return solicitud

        perfil, _ = PerfilConstructoraMP.objects.update_or_create(
            constructora=constructora,
            defaults={
                'nombre_comercial': solicitud.nombre_empresa,
                'nit': solicitud.nit,
                'descripcion': solicitud.descripcion_empresa,
                'estado_certificacion': 'certificada',
                'nivel_certificacion': nivel,
                'certificada_en': timezone.now(),
                'certificada_por': revisada_por,
                'zonas_interes': solicitud.zonas_interes or [],
                'tipos_proyecto': solicitud.tipos_proyecto or [],
                'proyectos_ejecutados': solicitud.proyectos_ejecutados,
                'documentos_certificacion': solicitud.documentos or [],
            },
        )
        return perfil

    def rechazar(self, solicitud, revisada_por, notas: str = ''):
        solicitud.estado = 'rechazada'
        solicitud.revisada_por = revisada_por
        solicitud.notas_revision = notas
        solicitud.save(
            update_fields=['estado', 'revisada_por', 'notas_revision', 'updated_at']
        )
        return solicitud
