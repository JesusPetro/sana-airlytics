from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import ZoneRepository
from .dtos import UpdateZoneInput


class ZoneNotFoundError(Exception): ...


class UpdateZoneUseCase:
    """Caso de uso: editar campos de una zona existente."""

    def __init__(self, repo: ZoneRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: UpdateZoneInput) -> None:
        """Valida que la zona exista y actualiza los campos no None."""
        if all(v is None for v in (cmd.name, cmd.center_lat, cmd.center_lon, cmd.radius_m)):
            raise ValueError("Al menos un campo debe ser provisto para actualizar el recurso.")
        zone = await self._repo.find_by_id(UUID(cmd.zone_id))
        if zone is None:
            raise ZoneNotFoundError(cmd.zone_id)
        await self._repo.update(
            UUID(cmd.zone_id),
            cmd.name,
            cmd.center_lat,
            cmd.center_lon,
            cmd.radius_m,
        )
