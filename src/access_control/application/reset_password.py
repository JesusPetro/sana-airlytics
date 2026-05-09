from __future__ import annotations

from shared.infrastructure.logger import get_logger

from ..domain.ports.repositories import UserRepository
from ..domain.ports.token_service import TokenInvalidError, TokenService
from ..domain.user import PasswordTooWeakError as _DomainWeakPassword
from .dtos import ResetPasswordInput, ResetPasswordOutput
from .errors import WeakPasswordError

logger = get_logger(__name__)


class ResetPasswordError(Exception):
    """Token invalido, expirado o usuario no encontrado."""


class ResetPasswordUseCase:
    """
    Caso de uso: confirmar el reset de contrasena usando el token recibido por email.
    """

    def __init__(
        self,
        user_repo: UserRepository,
        token_service: TokenService,
    ) -> None:
        self._users = user_repo
        self._tokens = token_service

    async def execute(self, cmd: ResetPasswordInput) -> ResetPasswordOutput:
        """
        Valida el token de reset, localiza al usuario y actualiza su contrasena.
        Lanza ResetPasswordError si el token es invalido o el usuario no existe.
        Lanza PasswordTooWeakError si la nueva contrasena no cumple los requisitos.
        """
        try:
            email = self._tokens.validate_reset_token(cmd.token)
        except TokenInvalidError as exc:
            logger.warning("Token de reset invalido o expirado.")
            raise ResetPasswordError("Invalid or expired reset token.") from exc

        user = await self._users.find_by_email(email)
        if user is None:
            logger.warning(
                "Token de reset valido pero usuario no encontrado.",
                extra={"email": email},
            )
            raise ResetPasswordError("User not found.")

        try:
            user.change_password(cmd.new_password)
        except _DomainWeakPassword as e:
            raise WeakPasswordError(str(e)) from e

        await self._users.save(user)

        logger.info(
            "Contrasena actualizada correctamente via reset.",
            extra={"user_id": str(user.id)},
        )
        return ResetPasswordOutput(message="Password updated successfully.")
