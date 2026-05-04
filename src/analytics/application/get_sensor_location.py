from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import LocationReadRepository
from .dtos import LocationDTO


class GetSensorLocationUseCase:
    """Caso de uso: obtener la ubicacion actual de un sensor."""

    def __init__(self, repo: LocationReadRepository) -> None:
        self._repo = repo

    async def execute(self, sensor_id: str) -> LocationDTO | None:
        """Retorna la ubicacion actual o None si el sensor no tiene ubicacion registrada."""
        result = await self._repo.find_current_location(UUID(sensor_id))
        if result is None:
            return None
        return LocationDTO(
            sensor_id=str(result["sensor_id"]),
            latitude=result["latitude"],
            longitude=result["longitude"],
            elevation=result["elevation"],
            updated_at=result["updated_at"],
        )
