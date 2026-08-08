from __future__ import annotations

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

_SALT = 'hab.marketplace.propietario'
_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def issue_propietario_token(portal_user_id: int, propietario_id: int) -> str:
    signer = TimestampSigner(salt=_SALT)
    return signer.sign(f'{portal_user_id}:{propietario_id}')


def verify_propietario_token(token: str) -> dict | None:
    signer = TimestampSigner(salt=_SALT)
    try:
        value = signer.unsign(token, max_age=_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    try:
        portal_user_id, propietario_id = value.split(':', 1)
        return {
            'portal_user_id': int(portal_user_id),
            'propietario_id': int(propietario_id),
        }
    except (ValueError, TypeError):
        return None
