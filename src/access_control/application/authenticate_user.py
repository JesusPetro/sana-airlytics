from __future__ import annotations

from ..domain.ports.repositories import AuditLogger, UserRepository
from ..domain.ports.token_service import TokenClaims, TokenService
from .dtos import LoginInput, TokenOutput


class AuthenticationError(Exception):
    """Credenciales invalidas. Mensaje generico para no revelar si el email existe."""


class AuthenticateUserUseCase:
    """Caso de uso: autenticar un usuario y emitir tokens de sesion."""

    def __init__(
        self,
        user_repo: UserRepository,
        token_service: TokenService,
        audit_logger: AuditLogger,
    ) -> None:
        self._users = user_repo
        self._tokens = token_service
        self._audit = audit_logger

    async def execute(
        self,
        cmd: LoginInput,
        ip_address: str | None = None,
    ) -> TokenOutput:
        """
        Verifica las credenciales y genera tokens de acceso y refresh.
        Siempre retorna el mismo mensaje de error para no revelar si el email existe.
        """
        user = await self._users.find_by_email(cmd.email)

        # Verificacion unificada: mismo mensaje si no existe o si la contrasena es incorrecta
        if user is None or not user.verify_password(cmd.password):
            await self._audit.log(
                user_id=user.id if user else "unknown",  # type: ignore[arg-type]
                action="LOGIN_FAILED",
                resource_type="session",
                resource_id=None,
                success=False,
                ip_address=ip_address,
            )
            raise AuthenticationError("Credenciales invalidas")

        if not user.is_active:
            raise AuthenticationError("Credenciales invalidas")

        claims = TokenClaims(
            user_id=str(user.id),
            email=user.email,
            type=user.type,
        )
        access_token = self._tokens.generate_token(claims)
        refresh_token = self._tokens.generate_refresh_token(str(user.id))

        await self._audit.log(
            user_id=str(user.id),
            action="LOGIN",
            resource_type="session",
            resource_id=None,
            success=True,
            ip_address=ip_address,
        )
        return TokenOutput(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=str(user.id),
            type=user.type,
        )
