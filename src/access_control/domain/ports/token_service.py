from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class TokenClaims:
    """Claims incluidos en el token de acceso JWT."""

    user_id: str
    email: str
    type: str | None    # valor informativo de users.type


class TokenService(Protocol):
    """
    Puerto para generacion y validacion de tokens de sesion.
    Implementado por JwtTokenService (JWT propio) o por un adaptador externo.
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
