from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.domain.datastream import Datastream
from data_ingestion.domain.ports.repositories import DatastreamRepository
from data_ingestion.domain.processing_level import ProcessingLevel
from device_management.infrastructure.orm_models import SensorModel
from shared.domain.device_id import DeviceId

from .orm_models import DatastreamModel, ObservedPropertyModel, ProcessingLevelModel


class PostgresDatastreamRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_device_and_property(
        self,
        device_id: DeviceId,
        property_code: str,
        level: ProcessingLevel,
    ) -> Datastream | None:
        stmt = (
            select(DatastreamModel)
            .join(SensorModel, DatastreamModel.sensor_id == SensorModel.id)
            .join(
                ObservedPropertyModel,
                DatastreamModel.observed_property_id == ObservedPropertyModel.id,
            )
            .join(
                ProcessingLevelModel,
                DatastreamModel.processing_level_id == ProcessingLevelModel.id,
            )
            .where(
                SensorModel.id == UUID(device_id.value),
                ObservedPropertyModel.code == property_code,
                ProcessingLevelModel.code == level.value,
            )
        )
        row = (await self._session.execute(stmt)).scalar_one_or_none()
        if row is None:
            return None
        return Datastream(
            id=row.id,
            device_id=device_id,
            observed_property_code=property_code,
            processing_level=level,
        )

    async def find_all_by_device(self, device_id: DeviceId) -> list[Datastream]:
        stmt = (
            select(DatastreamModel)
            .join(SensorModel, DatastreamModel.sensor_id == SensorModel.id)
            .join(
                ObservedPropertyModel,
                DatastreamModel.observed_property_id == ObservedPropertyModel.id,
            )
            .join(
                ProcessingLevelModel,
                DatastreamModel.processing_level_id == ProcessingLevelModel.id,
            )
            .where(SensorModel.id == UUID(device_id.value))
            # add_columns hace que execute() retorne tuplas (DatastreamModel, prop_code, level_code)
            .add_columns(ObservedPropertyModel.code, ProcessingLevelModel.code)
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            Datastream(
                id=ds.id,
                device_id=device_id,
                observed_property_code=prop_code,
                processing_level=ProcessingLevel(level_code),
            )
            for ds, prop_code, level_code in rows
        ]

    async def save(self, datastream: Datastream) -> None:
        observed_property_id = await self._resolve_observed_property_id(
            datastream.observed_property_code
        )
        processing_level_id = await self._resolve_processing_level_id(
            datastream.processing_level
        )
        model = DatastreamModel(
            id=datastream.id,
            sensor_id=UUID(datastream.device_id.value),
            observed_property_id=observed_property_id,
            processing_level_id=processing_level_id,
            name=f"{datastream.observed_property_code} {datastream.processing_level.value}",
        )
        self._session.add(model)
        await self._session.flush()

    async def _resolve_observed_property_id(self, code: str) -> UUID:
        stmt = select(ObservedPropertyModel.id).where(ObservedPropertyModel.code == code)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            raise ValueError(f"ObservedProperty not found: {code!r}")
        return row

    async def _resolve_processing_level_id(self, level: ProcessingLevel) -> UUID:
        stmt = (
            select(ProcessingLevelModel.id)
            .where(ProcessingLevelModel.code == level.value)
        )
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            raise ValueError(f"ProcessingLevel not found: {level.value!r}")
        return row
