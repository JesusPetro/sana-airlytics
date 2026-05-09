from __future__ import annotations

from shared.infrastructure.logger import get_logger
import time
from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.access_control.domain.ports.token_service import TokenInvalidError, TokenService

from ..config.settings import settings

logger = get_logger(__name__)

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

    def __init__(self, app, token_service: TokenService) -> None:
        super().__init__(app)
        self._token_service = token_service

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Procesa la request y renueva la cookie si el token esta por vencer."""
        token = request.cookies.get(settings.COOKIE_NAME)
        response = await call_next(request)

        if not token:
            return response

        try:
            claims = self._token_service.validate_token(token)
        except TokenInvalidError:
            # Token invalido — dejar pasar, el endpoint decidira
            return response

        if claims.exp and (claims.exp - time.time()) < _RENEWAL_THRESHOLD_SECONDS:
            new_token = self._token_service.generate_token(claims)
            cookie_cfg = settings.cookie_config
            response.set_cookie(value=new_token, **cookie_cfg)
            logger.debug(
                "Cookie de sesion renovada automaticamente.",
                extra={"user_id": claims.user_id},
            )

        return response
