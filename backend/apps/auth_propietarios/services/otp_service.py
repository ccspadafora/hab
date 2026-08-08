from __future__ import annotations

import random
import string
from dataclasses import dataclass
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone


@dataclass(frozen=True)
class OTPResult:
    code: str
    expires: object  # datetime


class OTPService:
    OTP_LENGTH = 6
    OTP_TTL_MINUTES = 10
    MAX_ATTEMPTS = 3
    LOCKOUT_MINUTES = 10

    @staticmethod
    def generate(telefono: str) -> OTPResult:
        code = ''.join(random.choices(string.digits, k=OTPService.OTP_LENGTH))
        expires = timezone.now() + timedelta(minutes=OTPService.OTP_TTL_MINUTES)
        cache_key = f'otp:{telefono}'
        cache.set(
            cache_key,
            {'code': code, 'expires': expires.isoformat()},
            timeout=OTPService.OTP_TTL_MINUTES * 60,
        )
        return OTPResult(code=code, expires=expires)

    @staticmethod
    def verify(telefono: str, code_input: str) -> tuple[bool, str]:
        """Returns (is_valid, error_message)."""
        from apps.auth_propietarios.models import PropietarioPortalUser

        try:
            user = PropietarioPortalUser.objects.get(telefono=telefono)
        except PropietarioPortalUser.DoesNotExist:
            return False, 'Número no registrado'

        if user.bloqueado_hasta and timezone.now() < user.bloqueado_hasta:
            remaining = (user.bloqueado_hasta - timezone.now()).seconds // 60
            return False, f'Cuenta bloqueada. Espera {remaining} minutos.'

        if not user.otp_code or not user.otp_expires_at:
            return False, 'Solicita un nuevo código'

        if timezone.now() > user.otp_expires_at:
            return False, 'El código expiró. Solicita uno nuevo.'

        if user.otp_code != code_input:
            user.otp_intentos += 1
            if user.otp_intentos >= OTPService.MAX_ATTEMPTS:
                user.bloqueado_hasta = timezone.now() + timedelta(
                    minutes=OTPService.LOCKOUT_MINUTES
                )
            user.save(update_fields=['otp_intentos', 'bloqueado_hasta'])
            remaining = OTPService.MAX_ATTEMPTS - user.otp_intentos
            return False, f'Código incorrecto. Te quedan {max(0, remaining)} intentos.'

        user.otp_code = ''
        user.otp_expires_at = None
        user.otp_intentos = 0
        user.bloqueado_hasta = None
        user.telefono_verificado = True
        user.save(
            update_fields=[
                'otp_code',
                'otp_expires_at',
                'otp_intentos',
                'bloqueado_hasta',
                'telefono_verificado',
            ]
        )
        return True, ''
