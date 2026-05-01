from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class TokenClaims:
    """Claims incluidos en el token de acceso JWT."""

    user_id: str
    email: str
    type: str | None  # valor informativo de users.type


class TokenInvalidError(Exception):
    """Se lanza cuando el token JWT es invalido, expirado o malformado."""


class TokenService(Protocol):
    """
    Puerto para generacion y validacion de tokens de sesion.
    Implementado por JwtTokenService en infrastructure/security/.
    El dominio y la aplicacion solo conocen este Protocol.
    """

    def generate_token(self, claims: TokenClaims) -> str:
        """Genera y retorna un token de acceso con expiracion corta."""
        ...

    def validate_token(self, token: str) -> TokenClaims:
        """
        Valida el token y retorna los claims.
        Lanza TokenInvalidError si el token es invalido o expirado.
        """
        ...

    def generate_refresh_token(self, user_id: str) -> str:
        """Genera un token de refresh de larga duracion."""
        ...

    def generate_reset_token(self, email: str) -> str:
        """
        Genera un token JWT de 15 minutos para reset de contrasena.
        El token incluye el claim type='password_reset' para diferenciarlo
        de un access token normal.
        """
        ...

    def validate_reset_token(self, token: str) -> str:
        """
        Valida el token de reset y retorna el email del usuario.
        Lanza TokenInvalidError si el token es invalido, expirado
        o si su claim type no es 'password_reset'.
        """
        ...

    def validate_refresh_token(self, token: str) -> str:
        """
        Valida el token de refresh y retorna el user_id.
        Lanza TokenInvalidError si el token es invalido, expirado
        o si su claim type no es 'refresh'.
        """
        ...
