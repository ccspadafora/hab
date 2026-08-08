from __future__ import annotations

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from django.utils import timezone

from apps.auth_propietarios.services.otp_service import OTPService


class AuthPropietarioService:
    """Registro / login OTP para portal de propietarios."""

    def registrar(
        self,
        nombre: str,
        telefono: str,
        password: str,
        email: str = '',
    ) -> dict:
        from apps.auth_propietarios.models import PropietarioPortalUser
        from apps.auth_propietarios.tasks import task_enviar_otp_whatsapp
        from apps.leads.models import Propietario

        if PropietarioPortalUser.objects.filter(telefono=telefono).exists():
            return {'ok': False, 'error': 'Ya existe una cuenta con este teléfono'}

        propietario = Propietario.objects.filter(
            Q(telefono_principal=telefono) | Q(whatsapp_phone=telefono)
        ).first()
        if propietario is None:
            propietario = Propietario.objects.create(
                nombre=nombre,
                telefono_principal=telefono,
                whatsapp_phone=telefono,
                email=email or '',
            )
        else:
            update_fields: list[str] = []
            if nombre and (not propietario.nombre or propietario.nombre == 'Sin nombre'):
                propietario.nombre = nombre
                update_fields.append('nombre')
            if email and not propietario.email:
                propietario.email = email
                update_fields.append('email')
            if not propietario.whatsapp_phone:
                propietario.whatsapp_phone = telefono
                update_fields.append('whatsapp_phone')
            if update_fields:
                propietario.save(update_fields=update_fields)

        user = PropietarioPortalUser.objects.create(
            propietario=propietario,
            telefono=telefono,
            email=email or '',
            password_hash=make_password(password),
        )

        otp = OTPService.generate(telefono)
        user.otp_code = otp.code
        user.otp_expires_at = otp.expires
        user.otp_intentos = 0
        user.save(update_fields=['otp_code', 'otp_expires_at', 'otp_intentos'])

        debug_otp = None
        try:
            task_enviar_otp_whatsapp.delay(telefono, otp.code)
        except Exception:
            if settings.DEBUG:
                debug_otp = otp.code

        if settings.DEBUG:
            debug_otp = debug_otp or otp.code

        result = {
            'ok': True,
            'status': 'registered',
            'portal_user_id': user.pk,
            'propietario_id': propietario.pk,
            'expires': otp.expires.isoformat(),
        }
        if debug_otp is not None:
            result['debug_otp'] = debug_otp
        return result

    def login(self, telefono: str, password: str) -> dict:
        from apps.auth_propietarios.models import PropietarioPortalUser
        from apps.auth_propietarios.services.token_service import issue_propietario_token

        try:
            user = PropietarioPortalUser.objects.get(telefono=telefono)
        except PropietarioPortalUser.DoesNotExist:
            return {'ok': False, 'error': 'Credenciales inválidas'}

        if not user.activo:
            return {'ok': False, 'error': 'Cuenta inactiva'}

        if not user.telefono_verificado:
            return {'ok': False, 'error': 'Teléfono no verificado. Completa OTP primero.'}

        if not check_password(password, user.password_hash):
            return {'ok': False, 'error': 'Credenciales inválidas'}

        user.ultimo_login = timezone.now()
        user.save(update_fields=['ultimo_login'])

        token = issue_propietario_token(user.pk, user.propietario_id)
        return {
            'ok': True,
            'access': token,
            'portal_user_id': user.pk,
            'propietario_id': user.propietario_id,
        }

    def solicitar_otp(self, telefono: str) -> dict:
        from apps.auth_propietarios.models import PropietarioPortalUser
        from apps.auth_propietarios.tasks import task_enviar_otp_whatsapp

        try:
            user = PropietarioPortalUser.objects.get(telefono=telefono)
        except PropietarioPortalUser.DoesNotExist:
            return {'ok': False, 'error': 'Número no registrado'}

        otp = OTPService.generate(telefono)
        user.otp_code = otp.code
        user.otp_expires_at = otp.expires
        user.otp_intentos = 0
        user.save(update_fields=['otp_code', 'otp_expires_at', 'otp_intentos'])

        debug_otp = None
        try:
            task_enviar_otp_whatsapp.delay(telefono, otp.code)
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
        from apps.auth_propietarios.models import PropietarioPortalUser
        from apps.auth_propietarios.services.token_service import issue_propietario_token

        ok, error = OTPService.verify(telefono, code)
        if not ok:
            return {'ok': False, 'error': error}

        user = PropietarioPortalUser.objects.get(telefono=telefono)
        user.ultimo_login = timezone.now()
        user.save(update_fields=['ultimo_login'])

        token = issue_propietario_token(user.pk, user.propietario_id)
        return {
            'ok': True,
            'portal_user_id': user.pk,
            'propietario_id': user.propietario_id,
            'access': token,
        }

    def set_password(self, portal_user, raw_password: str) -> None:
        portal_user.password_hash = make_password(raw_password)
        portal_user.save(update_fields=['password_hash'])

    def check_password(self, portal_user, raw_password: str) -> bool:
        return check_password(raw_password, portal_user.password_hash)
