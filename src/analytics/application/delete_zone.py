from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import ZoneRepository
from .update_zone import ZoneNotFoundError


class DeleteZoneUseCase:
    """Caso de uso: eliminar una zona existente."""

    def __init__(self, repo: ZoneRepository) -> None:
        self._repo = repo

    async def execute(self, zone_id: str) -> None:
        """Valida que la zona exista y la elimina."""
        zone = await self._repo.find_by_id(UUID(zone_id))
        if zone is None:
            raise ZoneNotFoundError(zone_id)
        await self._repo.delete(UUID(zone_id))
