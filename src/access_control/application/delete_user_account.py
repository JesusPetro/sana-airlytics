from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import AuditLogger, UserRepository
from .get_user_profile import UserNotFoundError


class DeleteUserAccountUseCase:
    """Caso de uso: desactivar la cuenta del usuario (soft delete)."""

    def __init__(
        self,
        user_repo: UserRepository,
        audit_logger: AuditLogger,
    ) -> None:
        self._users = user_repo
        self._audit = audit_logger

    async def execute(self, user_id: str) -> None:
        """
        Desactiva la cuenta del usuario (soft delete).
        El registro permanece en BD — no hay borrado fisico en MVP.
        Lanza UserNotFoundError si el usuario no existe o ya esta inactivo.
        """
        user = await self._users.find_by_id(UUID(user_id))
        if user is None or not user.is_active:
            raise UserNotFoundError(user_id)
        await self._users.deactivate(UUID(user_id))
        await self._audit.log(
            user_id=user_id,
            action="ACCOUNT_DELETED",
            resource_type="user",
            resource_id=user_id,
            success=True,
            ip_address=None,
        )
