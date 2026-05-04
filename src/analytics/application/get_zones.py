from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import ZoneRepository
from .dtos import ZoneDTO


class GetZonesUseCase:
    """Caso de uso: listar zonas geograficas de un workspace."""

    def __init__(self, repo: ZoneRepository) -> None:
        self._repo = repo

    async def execute(self, workspace_id: str) -> list[ZoneDTO]:
        """Retorna todas las zonas del workspace."""
        zones = await self._repo.find_by_workspace(UUID(workspace_id))
        return [
            ZoneDTO(
                zone_id=str(z.id),
                workspace_id=str(z.workspace_id),
                name=z.name,
                center_lat=z.center_lat,
                center_lon=z.center_lon,
                radius_m=z.radius_m,
                created_by=str(z.created_by),
                created_at=z.created_at,
            )
            for z in zones
        ]
