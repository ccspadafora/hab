"""Marketplace propietario auth views — re-export from apps.auth_propietarios."""
from __future__ import annotations

from apps.auth_propietarios.views import (
    LoginPropietarioView,
    RegistroPropietarioView,
    SolicitarOTPView,
    VerificarOTPView,
)

__all__ = [
    'RegistroPropietarioView',
    'LoginPropietarioView',
    'SolicitarOTPView',
    'VerificarOTPView',
]
