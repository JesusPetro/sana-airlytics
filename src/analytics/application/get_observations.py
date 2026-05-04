from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.ports.repositories import ObservationReadRepository
from .dtos import ObservationPointDTO


class GetObservationsUseCase:
    """Caso de uso: obtener serie temporal cruda de un datastream."""

    def __init__(self, repo: ObservationReadRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        datastream_id: str,
        from_dt: datetime,
        to_dt: datetime,
        qualifier: str | None = None,
        exclude_oor: bool = False,
    ) -> list[ObservationPointDTO]:
        """Retorna la serie temporal filtrada por rango y calificador."""
        rows = await self._repo.find_series(
            datastream_id=UUID(datastream_id),
            from_dt=from_dt,
            to_dt=to_dt,
            qualifier=qualifier,
            exclude_oor=exclude_oor,
        )
        return [
            ObservationPointDTO(
                phenomenon_time=r["phenomenon_time"],
                result=r["result"],
                qualifier=r["qualifier"],
            )
            for r in rows
        ]
