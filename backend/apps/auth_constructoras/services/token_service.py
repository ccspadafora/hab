from __future__ import annotations

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

_SALT = 'hab.marketplace.constructora'
_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def issue_constructora_token(perfil_id: int | None, constructora_id: int) -> str:
    signer = TimestampSigner(salt=_SALT)
    perfil_part = str(perfil_id) if perfil_id is not None else ''
    return signer.sign(f'{perfil_part}:{constructora_id}')


def verify_constructora_token(token: str) -> dict | None:
    signer = TimestampSigner(salt=_SALT)
    try:
        value = signer.unsign(token, max_age=_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    try:
        perfil_part, constructora_id = value.split(':', 1)
        perfil_id = int(perfil_part) if perfil_part else None
        return {
            'perfil_id': perfil_id,
            'constructora_id': int(constructora_id),
        }
    except (ValueError, TypeError):
        return None
