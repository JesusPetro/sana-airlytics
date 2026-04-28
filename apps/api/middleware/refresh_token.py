from __future__ import annotations

import logging
import time
from collections.abc import Callable

from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ..config.settings import settings

logger = logging.getLogger(__name__)

# Umbral en segundos: renovar si el token expira en menos de 15 minutos
_RENEWAL_THRESHOLD_SECONDS = 900


class RefreshTokenMiddleware(BaseHTTPMiddleware):
    """
    Middleware que renueva automaticamente la cookie de sesion cuando esta
    proxima a expirar.

    Si el access token es valido y vence en menos de 15 minutos, genera
    uno nuevo con los mismos claims y actualiza la cookie. El usuario
    nunca pierde la sesion durante operaciones largas.

    Tokens invalidos o ausentes se dejan pasar sin modificacion;
    el endpoint protegido retornara 401 si es necesario.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Procesa la request y renueva la cookie si el token esta por vencer."""
        token = request.cookies.get(settings.COOKIE_NAME)
        response = await call_next(request)

        if not token:
            return response

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError:
            # Token invalido — dejar pasar, el endpoint decidira
            return response

        exp = payload.get("exp")
        if exp and (exp - time.time()) < _RENEWAL_THRESHOLD_SECONDS:
            # Generar nuevo token con los mismos claims, sin el exp viejo
            new_payload = {k: v for k, v in payload.items() if k != "exp"}
            from src.access_control.infrastructure.security.token_factory import (
                create_access_token,
            )
            new_token = create_access_token(
                user_id=new_payload["sub"],
                email=new_payload["email"],
                user_type=new_payload.get("type"),
                secret_key=settings.JWT_SECRET_KEY,
                algorithm=settings.JWT_ALGORITHM,
                expire_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
            )
            cookie_cfg = settings.cookie_config
            response.set_cookie(value=new_token, **cookie_cfg)
            logger.debug(
                "Cookie de sesion renovada automaticamente.",
                extra={"user_id": new_payload.get("sub")},
            )

        return response
