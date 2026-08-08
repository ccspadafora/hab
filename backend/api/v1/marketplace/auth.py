from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings

from apps.auth_constructoras.services.token_service import verify_constructora_token
from apps.auth_propietarios.services.token_service import verify_propietario_token

if TYPE_CHECKING:
    from rest_framework.request import Request

    from apps.leads.models import Propietario
    from apps.marketplace.perfiles_constructora.models import PerfilConstructoraMP


def _bearer_token(request: Request) -> str | None:
    auth = request.META.get('HTTP_AUTHORIZATION', '') or ''
    if auth.lower().startswith('bearer '):
        return auth[7:].strip() or None
    return None


def get_propietario_from_request(request: Request) -> Propietario | None:
    """
    Resolve leads.Propietario from Bearer token or X-Propietario-Id (dev fallback).
    """
    from apps.leads.models import Propietario

    token = _bearer_token(request)
    if token:
        payload = verify_propietario_token(token)
        if payload:
            try:
                return Propietario.objects.get(pk=payload['propietario_id'])
            except Propietario.DoesNotExist:
                return None

    propietario_id = request.headers.get('X-Propietario-Id') or request.query_params.get(
        'propietario_id'
    )
    if propietario_id and (settings.DEBUG or token is None):
        try:
            return Propietario.objects.get(pk=int(propietario_id))
        except (Propietario.DoesNotExist, TypeError, ValueError):
            return None
    return None


def get_perfil_from_request(request: Request, body_perfil_id=None) -> PerfilConstructoraMP | None:
    """
    Resolve PerfilConstructoraMP from Bearer constructora token,
    X-Perfil-Id header, or optional body perfil_id.
    """
    from apps.marketplace.perfiles_constructora.models import PerfilConstructoraMP

    token = _bearer_token(request)
    if token:
        payload = verify_constructora_token(token)
        if payload and payload.get('perfil_id'):
            try:
                return PerfilConstructoraMP.objects.get(pk=payload['perfil_id'])
            except PerfilConstructoraMP.DoesNotExist:
                pass
        if payload and payload.get('constructora_id'):
            perfil = PerfilConstructoraMP.objects.filter(
                constructora_id=payload['constructora_id'],
            ).first()
            if perfil:
                return perfil

    perfil_id = (
        body_perfil_id
        or request.headers.get('X-Perfil-Id')
        or request.query_params.get('perfil_id')
    )
    if perfil_id:
        try:
            return PerfilConstructoraMP.objects.get(pk=int(perfil_id))
        except (PerfilConstructoraMP.DoesNotExist, TypeError, ValueError):
            return None
    return None
