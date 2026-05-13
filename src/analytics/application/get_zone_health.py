from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.aqi_thresholds import AqiThresholds
from ..domain.ports.repositories import ZoneRepository
from .dtos import ZoneHealthDTO


class ZoneNotFoundError(Exception):
    """La zona indicada no existe."""


class GetZoneHealthUseCase:
    """
    Caso de uso: calcular el veredicto de calidad del aire de una zona.
    Agrupa las mediciones tomadas dentro del radio en el rango temporal
    indicado y las clasifica con AqiThresholds.
    """

    def __init__(self, repo: ZoneRepository) -> None:
        self._repo = repo

    async def execute(self, zone_id: str, from_dt: datetime, to_dt: datetime) -> ZoneHealthDTO:
        """Lanza ZoneNotFoundError si la zona no existe."""
        zone = await self._repo.find_by_id(UUID(zone_id))
        if zone is None:
            raise ZoneNotFoundError(f"Zone not found: {zone_id!r}")

        rows = await self._repo.find_health(zone, from_dt, to_dt)

        variables = []
        verdicts = []
        for row in rows:
            verdict = AqiThresholds.classify(row["property_code"], row["avg_value"])
            variables.append({
                "property_code": row["property_code"],
                "avg_value": row["avg_value"],
                "verdict": verdict,
            })
            verdicts.append(verdict)

        overall = self._overall_verdict(verdicts)

        return ZoneHealthDTO(
            zone_id=zone_id,
            zone_name=zone.name,
            overall_verdict=overall,
            variables=variables,
        )

    def _overall_verdict(self, verdicts: list[str]) -> str:
        """
        Retorna el peor veredicto de la lista.
        Orden: poor > moderate > good > unknown.
        """
        if not verdicts:
            return "unknown"
        priority = {"poor": 3, "moderate": 2, "good": 1, "unknown": 0}
        return max(verdicts, key=lambda v: priority.get(v, 0))
