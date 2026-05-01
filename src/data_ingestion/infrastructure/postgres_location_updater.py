from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.domain.ports.repositories import LocationUpdater
from shared.infrastructure.orm_models import HistoricalLocationModel, LocationModel
from shared.domain.coordinate import Coordinate
from shared.domain.device_id import DeviceId


class PostgresLocationUpdater:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def update_location(
        self,
        device_id: DeviceId,
        coordinate: Coordinate,
        timestamp: datetime,
    ) -> None:
        sensor_id = UUID(device_id.value)

        current = await self._session.scalar(
            select(LocationModel).where(LocationModel.sensor_id == sensor_id)
        )
        if current is not None:
            self._session.add(HistoricalLocationModel(
                sensor_id=sensor_id,
                latitude=current.latitude,
                longitude=current.longitude,
                elevation=current.elevation,
                recorded_at=current.updated_at,
            ))

        stmt = (
            insert(LocationModel)
            .values(
                sensor_id=sensor_id,
                latitude=coordinate.latitude,
                longitude=coordinate.longitude,
                elevation=coordinate.altitude,
            )
            .on_conflict_do_update(
                index_elements=["sensor_id"],
                set_={
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude,
                    "elevation": coordinate.altitude,
                    "updated_at": timestamp,
                },
            )
        )
        await self._session.execute(stmt)
