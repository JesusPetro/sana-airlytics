from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import UserRepository
from .dtos import UserProfileOutput


class UserNotFoundError(Exception):
    """El usuario no existe o esta inactivo."""


class GetUserProfileUseCase:
    """Caso de uso: obtener el perfil completo de un usuario autenticado."""

    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    async def execute(self, user_id: str) -> UserProfileOutput:
        """
        Retorna el perfil completo del usuario desde la BD.
        Lee directamente la BD — no el JWT — para reflejar cambios recientes.
        """
        user = await self._users.find_by_id(UUID(user_id))
        if user is None or not user.is_active:
            raise UserNotFoundError(user_id)
        return UserProfileOutput(
            user_id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            middle_name=user.middle_name,
            phone=user.phone,
            address=user.address,
            type=user.type,
            is_active=user.is_active,
        )
