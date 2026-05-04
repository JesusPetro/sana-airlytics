from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.ports.repositories import LocationReadRepository
from .dtos import HeatmapPointDTO


class GetHeatmapUseCase:
    """Caso de uso: obtener puntos de mapa de calor por contaminante en un workspace."""

    def __init__(self, repo: LocationReadRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        workspace_id: str,
        property_code: str,
        from_dt: datetime,
        to_dt: datetime,
    ) -> list[HeatmapPointDTO]:
        """Retorna pares lat/lon con el valor promedio de la variable indicada."""
        rows = await self._repo.find_heatmap_points(
            workspace_id=UUID(workspace_id),
            property_code=property_code,
            from_dt=from_dt,
            to_dt=to_dt,
        )
        return [
            HeatmapPointDTO(
                latitude=r["latitude"],
                longitude=r["longitude"],
                avg_value=r["avg_value"],
            )
            for r in rows
        ]
