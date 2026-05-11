from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.ports.repositories import LocationReadRepository
from .dtos import SnapshotDTO, SnapshotVariableDTO


class GetSensorSnapshotUseCase:
    """Caso de uso: obtener todas las variables de un sensor en un instante dado."""

    def __init__(self, repo: LocationReadRepository) -> None:
        self._repo = repo

    async def execute(self, sensor_id: str, at_dt: datetime | None) -> SnapshotDTO | None:
        rows = await self._repo.find_snapshot(UUID(sensor_id), at_dt)
        if not rows:
            return None
        return SnapshotDTO(
            sensor_id=sensor_id,
            phenomenon_time=rows[0]["phenomenon_time"],
            variables=[
                SnapshotVariableDTO(
                    property_code=r["property_code"],
                    property_name=r["property_name"],
                    result=r["result"],
                    unit_symbol=r["unit_symbol"],
                    qualifier=r["qualifier"],
                )
                for r in rows
            ],
        )
