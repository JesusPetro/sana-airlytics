from __future__ import annotations

from shared.infrastructure.logger import get_logger
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from ...domain.ports.token_service import TokenInvalidError

logger = get_logger(__name__)


def create_access_token(
    *,
    user_id: str,
    email: str,
    user_type: str | None,
    secret_key: str,
    algorithm: str,
    expire_minutes: int,
) -> str:
    """
    Genera un JWT de acceso con expiracion corta.
    Los claims incluyen sub (user_id), email, type y exp.
    """
    expire = datetime.now(UTC) + timedelta(minutes=expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "type": user_type,
        "token_type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def create_refresh_token(
    *,
    user_id: str,
    secret_key: str,
    algorithm: str,
    expire_days: int,
) -> str:
    """
    Genera un JWT de refresh con expiracion larga.
    Solo contiene sub (user_id), token_type y exp.
    """
    expire = datetime.now(UTC) + timedelta(days=expire_days)
    payload = {
        "sub": user_id,
        "token_type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def create_reset_token(
    *,
    email: str,
    secret_key: str,
    algorithm: str,
    expire_minutes: int,
) -> str:
    """
    Genera un JWT de reset de contrasena con TTL corto (15 minutos por defecto).
    Incluye el claim type='password_reset' para distinguirlo de otros tokens.
    """
    expire = datetime.now(UTC) + timedelta(minutes=expire_minutes)
    payload = {
        "sub": email,
        "type": "password_reset",
        "exp": expire,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_token(
    token: str,
    secret_key: str,
    algorithm: str,
) -> dict:
    """
    Decodifica y verifica la firma y expiracion de un JWT.
    Lanza TokenInvalidError si el token es invalido o expirado.
    """
    try:
        return jwt.decode(token, secret_key, algorithms=[algorithm])
    except JWTError as exc:
        logger.debug("Fallo al decodificar token JWT: %s", exc)
        raise TokenInvalidError("Token invalido o expirado.") from exc
