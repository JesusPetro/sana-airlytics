from __future__ import annotations

from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from ..domain.ports.token_service import TokenClaims, TokenInvalidError
from .security.token_factory import create_reset_token, decode_token


class JwtTokenService:
    """
    Implementa TokenService con JWT firmado con clave secreta (HS256).
    Access token: 60 minutos. Refresh token: 7 dias.
    Los tokens se entregan en cookies HttpOnly desde la capa de infraestructura HTTP.
    """

    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    def __init__(
        self,
        secret_key: str,
        algorithm: str = "HS256",
        access_expire_minutes: int = 60,
        refresh_expire_days: int = 7,
        reset_expire_minutes: int = 15,
    ) -> None:
        self._secret_key = secret_key
        self._reset_exp = reset_expire_minutes

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
                exp=payload.get("exp"),
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

    def generate_reset_token(self, email: str) -> str:
        """Genera un JWT de reset de contrasena con TTL de 15 minutos."""
        return create_reset_token(
            email=email,
            secret_key=self._secret_key,
            algorithm=self.ALGORITHM,
            expire_minutes=self._reset_exp,
        )

    def validate_refresh_token(self, token: str) -> str:
        """
        Valida el JWT de refresh y retorna el user_id.
        Lanza TokenInvalidError si el token es invalido, expirado
        o si su claim type no es 'refresh'.
        """
        try:
            payload = jwt.decode(token, self._secret_key, algorithms=[self.ALGORITHM])
        except JWTError as exc:
            raise TokenInvalidError(str(exc)) from exc
        if payload.get("type") != "refresh":
            raise TokenInvalidError("Token no es de tipo refresh.")
        return payload["sub"]

    def validate_reset_token(self, token: str) -> str:
        """
        Valida el JWT de reset y retorna el email del usuario.
        Lanza TokenInvalidError si el token es invalido, expirado
        o si su claim type no es 'password_reset'.
        """
        payload = decode_token(token, self._secret_key, self.ALGORITHM)
        if payload.get("type") != "password_reset":
            raise TokenInvalidError("Token no es de tipo password_reset.")
        return payload["sub"]
