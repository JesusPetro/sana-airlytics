from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, Request, status

from src.access_control.domain.ports.token_service import TokenClaims, TokenInvalidError, TokenService
from ..config.settings import settings

logger = logging.getLogger(__name__)


def get_token_service(request: Request) -> TokenService:
    """
    Dependencia que retorna la instancia del servicio de tokens desde app.state.
    La instancia se crea una sola vez en create_app() y se comparte con el middleware.
    """
    return request.app.state.token_service


async def get_current_user(
    request: Request,
    token_service: TokenService = Depends(get_token_service),
) -> TokenClaims:
    """
    Dependencia FastAPI que extrae y valida el usuario autenticado.

    Lee el JWT desde la cookie httponly 'sana_session'.
    En development, acepta tambien el header Authorization: Bearer <token>
    como fallback para facilitar las pruebas con Swagger UI.

    Retorna TokenClaims si el token es valido.
    Lanza HTTPException 401 si no hay token o si es invalido.
    """
    token = request.cookies.get(settings.COOKIE_NAME)

    # Fallback a header Authorization solo en development (Swagger)
    if not token and settings.is_development:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        logger.warning("Request sin cookie de sesion ni header Authorization.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    try:
        claims = token_service.validate_token(token)
        return claims
    except TokenInvalidError:
        logger.warning(
            "Token invalido o expirado recibido.",
            extra={"path": str(request.url.path)},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
