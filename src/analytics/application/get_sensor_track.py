from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.ports.repositories import LocationReadRepository
from .dtos import TrackPointDTO


class GetSensorTrackUseCase:
    """Caso de uso: obtener la trayectoria historica de un sensor movil."""

    def __init__(self, repo: LocationReadRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        sensor_id: str,
        from_dt: datetime,
        to_dt: datetime,
    ) -> list[TrackPointDTO]:
        """Retorna la trayectoria del sensor en el rango temporal indicado."""
        rows = await self._repo.find_track(UUID(sensor_id), from_dt, to_dt)
        return [
            TrackPointDTO(
                latitude=r["latitude"],
                longitude=r["longitude"],
                elevation=r["elevation"],
                recorded_at=r["recorded_at"],
            )
            for r in rows
        ]
