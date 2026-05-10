from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import DatastreamReadRepository
from .dtos import DatastreamDTO


class GetDatastreamsUseCase:
    """Caso de uso: listar datastreams activos de un workspace."""

    def __init__(self, repo: DatastreamReadRepository) -> None:
        self._repo = repo

    async def execute(self, workspace_id: str) -> list[DatastreamDTO]:
        """Retorna los datastreams del workspace con metadatos de sensor, propiedad y unidad."""
        rows = await self._repo.find_by_workspace(UUID(workspace_id))
        return [
            DatastreamDTO(
                datastream_id=str(r["id"]),
                name=r["name"],
                description=r["description"],
                sensor_id=str(r["sensor_id"]),
                unit_id=str(r["unit_id"]),
                sensor_code=r["sensor_code"],
                sensor_name=r["sensor_name"],
                property_code=r["property_code"],
                property_name=r["property_name"],
                unit_code=r["unit_code"],
                unit_symbol=r["unit_symbol"],
                status=r["status"],
                phenomenon_time_start=r["phenomenon_time_start"],
                phenomenon_time_end=r["phenomenon_time_end"],
            )
            for r in rows
        ]
