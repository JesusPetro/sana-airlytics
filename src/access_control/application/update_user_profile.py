from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import UserRepository
from .dtos import UpdateUserProfileInput
from .get_user_profile import UserNotFoundError


class UpdateUserProfileUseCase:
    """Caso de uso: actualizar los campos editables del perfil del usuario."""

    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    async def execute(self, cmd: UpdateUserProfileInput) -> None:
        """
        Actualiza los campos editables del perfil.
        El email no es editable en este flujo.
        Lanza UserNotFoundError si el usuario no existe o esta inactivo.
        """
        user = await self._users.find_by_id(UUID(cmd.user_id))
        if user is None or not user.is_active:
            raise UserNotFoundError(cmd.user_id)
        await self._users.update_profile(
            user_id=UUID(cmd.user_id),
            first_name=cmd.first_name,
            last_name=cmd.last_name,
            middle_name=cmd.middle_name,
            phone=cmd.phone,
            address=cmd.address,
        )
