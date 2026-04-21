from __future__ import annotations

from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from ..domain.ports.token_service import TokenClaims


class TokenInvalidError(Exception):
    """El token es invalido, ha expirado o fue manipulado."""


class JwtTokenService:
    """
    Implementa TokenService con JWT firmado con clave secreta (HS256).
    Access token: 60 minutos. Refresh token: 7 dias.
    Los tokens se entregan en cookies HttpOnly desde la capa de infraestructura HTTP.
    """

    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    def __init__(self, secret_key: str) -> None:
        self._secret_key = secret_key

    def generate_token(self, claims: TokenClaims) -> str:
        """Genera un JWT de acceso con expiracion de 60 minutos."""
        payload = {
            "sub": claims.user_id,
            "email": claims.email,
            "type": claims.type,
            "exp": datetime.now(UTC) + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(payload, self._secret_key, algorithm=self.ALGORITHM)

    def validate_token(self, token: str) -> TokenClaims:
        """Valida el JWT y retorna los claims. Lanza TokenInvalidError si es invalido."""
        try:
            payload = jwt.decode(token, self._secret_key, algorithms=[self.ALGORITHM])
            return TokenClaims(
                user_id=payload["sub"],
                email=payload["email"],
                type=payload.get("type"),
            )
        except JWTError as exc:
            raise TokenInvalidError(str(exc)) from exc

    def generate_refresh_token(self, user_id: str) -> str:
        """Genera un JWT de refresh con expiracion de 7 dias."""
        payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": datetime.now(UTC) + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS),
        }
        return jwt.encode(payload, self._secret_key, algorithm=self.ALGORITHM)
