from __future__ import annotations

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from apps.auth_propietarios.services.otp_service import OTPService


class AuthConstructoraService:
    """Login / OTP para portal de constructoras."""

    def login(self, email: str, password: str) -> dict:
        from apps.auth_constructoras.models import ConstructoraPortalUser
        from apps.auth_constructoras.services.token_service import issue_constructora_token

        try:
            user = ConstructoraPortalUser.objects.select_related(
                'constructora', 'perfil_marketplace',
            ).get(email__iexact=email)
        except ConstructoraPortalUser.DoesNotExist:
            return {'ok': False, 'error': 'Credenciales inválidas'}

        if not user.activo:
            return {'ok': False, 'error': 'Cuenta inactiva'}

        password_ok = False
        if user.password_hash:
            password_ok = check_password(password, user.password_hash)
        elif settings.DEBUG:
            # Empty hash in DEBUG — allow stub login for portal wiring
            password_ok = True

        if not password_ok:
            return {'ok': False, 'error': 'Credenciales inválidas'}

        if not user.telefono_verificado and not user.email_verificado:
            return {'ok': False, 'error': 'Cuenta no verificada. Completa OTP primero.'}

        user.ultimo_login = timezone.now()
        user.save(update_fields=['ultimo_login'])

        perfil_id = user.perfil_marketplace_id
        token = issue_constructora_token(perfil_id, user.constructora_id)
        return {
            'ok': True,
            'access': token,
            'portal_user_id': user.pk,
            'constructora_id': user.constructora_id,
            'perfil_id': perfil_id,
            'email': user.email,
        }

    def solicitar_otp(self, telefono: str) -> dict:
        from apps.auth_constructoras.models import ConstructoraPortalUser
        from apps.auth_constructoras.tasks import task_enviar_otp_constructora

        try:
            user = ConstructoraPortalUser.objects.get(telefono=telefono)
        except ConstructoraPortalUser.DoesNotExist:
            return {'ok': False, 'error': 'Número no registrado'}

        otp = OTPService.generate(telefono)
        user.otp_code = otp.code
        user.otp_expires_at = otp.expires
        user.otp_intentos = 0
        user.save(update_fields=['otp_code', 'otp_expires_at', 'otp_intentos'])

        debug_otp = None
        try:
            task_enviar_otp_constructora.delay(telefono, otp.code)
        except Exception:
            if settings.DEBUG:
                debug_otp = otp.code

        if settings.DEBUG:
            debug_otp = debug_otp or otp.code

        result = {'ok': True, 'expires': otp.expires.isoformat()}
        if debug_otp is not None:
            result['debug_otp'] = debug_otp
        return result

    def verificar_otp(self, telefono: str, code: str) -> dict:
        from apps.auth_constructoras.models import ConstructoraPortalUser
        from apps.auth_constructoras.services.token_service import issue_constructora_token

        ok, error = self._verify_otp_on_user(telefono, code)
        if not ok:
            return {'ok': False, 'error': error}

        user = ConstructoraPortalUser.objects.select_related(
            'constructora', 'perfil_marketplace',
        ).get(telefono=telefono)
        user.ultimo_login = timezone.now()
        user.save(update_fields=['ultimo_login'])

        perfil_id = user.perfil_marketplace_id
        token = issue_constructora_token(perfil_id, user.constructora_id)
        return {
            'ok': True,
            'access': token,
            'portal_user_id': user.pk,
            'constructora_id': user.constructora_id,
            'perfil_id': perfil_id,
        }

    def set_password(self, portal_user, raw_password: str) -> None:
        portal_user.password_hash = make_password(raw_password)
        portal_user.save(update_fields=['password_hash'])

    def check_password(self, portal_user, raw_password: str) -> bool:
        if not portal_user.password_hash:
            return bool(settings.DEBUG)
        return check_password(raw_password, portal_user.password_hash)

    @staticmethod
    def _verify_otp_on_user(telefono: str, code_input: str) -> tuple[bool, str]:
        """Mirrors propietario OTP verify against ConstructoraPortalUser."""
        from datetime import timedelta

        from apps.auth_constructoras.models import ConstructoraPortalUser

        try:
            user = ConstructoraPortalUser.objects.get(telefono=telefono)
        except ConstructoraPortalUser.DoesNotExist:
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
