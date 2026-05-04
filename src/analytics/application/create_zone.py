from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid7

from ..domain.zone import Zone
from ..domain.ports.repositories import ZoneRepository
from .dtos import CreateZoneInput, ZoneDTO


class CreateZoneUseCase:
    """Caso de uso: crear una zona geografica en un workspace."""

    def __init__(self, repo: ZoneRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: CreateZoneInput) -> ZoneDTO:
        """Valida el radio y persiste la zona."""
        if cmd.radius_m <= 0:
            raise ValueError("El radio debe ser mayor a 0 metros.")

        zone = Zone(
            id=uuid7(),
            workspace_id=UUID(cmd.workspace_id),
            name=cmd.name,
            center_lat=cmd.center_lat,
            center_lon=cmd.center_lon,
            radius_m=cmd.radius_m,
            created_by=UUID(cmd.created_by),
            created_at=datetime.now(UTC),
        )
        await self._repo.save(zone)
        return ZoneDTO(
            zone_id=str(zone.id),
            workspace_id=str(zone.workspace_id),
            name=zone.name,
            center_lat=zone.center_lat,
            center_lon=zone.center_lon,
            radius_m=zone.radius_m,
            created_by=str(zone.created_by),
            created_at=zone.created_at,
        )
