from __future__ import annotations

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.observation import Observation
from ..domain.ports.repositories import ObservationRepository
from .orm_models import ObservationModel


class TimescaleObservationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save_batch(self, observations: list[Observation]) -> None:
        if not observations:
            return
        rows = [
            {
                "id": obs.id,
                "datastream_id": obs.datastream_id,
                "phenomenon_time": obs.phenomenon_time,
                "result_time": obs.result_time,
                "result": obs.result,
                "qualifier": obs.qualifier.value if obs.qualifier is not None else None,
            }
            for obs in observations
        ]
        stmt = insert(ObservationModel).values(rows).on_conflict_do_nothing()
        await self._session.execute(stmt)
