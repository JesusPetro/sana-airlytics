from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.domain.datastream import Datastream
from shared.domain.device_id import DeviceId

from .orm_models import DatastreamModel, ObservedPropertyModel, UnitModel


class PostgresDatastreamRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_device_and_property(
        self,
        device_id: DeviceId,
        property_code: str,
    ) -> Datastream | None:
        stmt = (
            select(DatastreamModel, ObservedPropertyModel.code, UnitModel.code)
            .join(
                ObservedPropertyModel,
                DatastreamModel.observed_property_id == ObservedPropertyModel.id,
            )
            .join(UnitModel, DatastreamModel.unit_id == UnitModel.id)
            .where(
                DatastreamModel.sensor_id == UUID(device_id.value),
                ObservedPropertyModel.code == property_code,
            )
        )
        row = (await self._session.execute(stmt)).one_or_none()
        if row is None:
            return None
        ds, prop_code, unit_code = row
        return Datastream(
            id=ds.id,
            device_id=device_id,
            observed_property_code=prop_code,
            unit_code=unit_code,
        )

    async def find_all_by_device(self, device_id: DeviceId) -> list[Datastream]:
        stmt = (
            select(DatastreamModel, ObservedPropertyModel.code, UnitModel.code)
            .join(
                ObservedPropertyModel,
                DatastreamModel.observed_property_id == ObservedPropertyModel.id,
            )
            .join(UnitModel, DatastreamModel.unit_id == UnitModel.id)
            .where(DatastreamModel.sensor_id == UUID(device_id.value))
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            Datastream(
                id=ds.id,
                device_id=device_id,
                observed_property_code=prop_code,
                unit_code=unit_code,
            )
            for ds, prop_code, unit_code in rows
        ]

    async def find_all_device_ids(self) -> set[UUID]:
        stmt = select(DatastreamModel.sensor_id).distinct()
        rows = (await self._session.execute(stmt)).scalars().all()
        return set(rows)

    async def save_batch(self, datastreams: list[Datastream]) -> None:
        if not datastreams:
            return

        property_codes = {ds.observed_property_code for ds in datastreams}
        unit_codes = {ds.unit_code for ds in datastreams}

        prop_rows = (
            await self._session.execute(
                select(ObservedPropertyModel.code, ObservedPropertyModel.id)
                .where(ObservedPropertyModel.code.in_(property_codes))
            )
        ).all()
        prop_map: dict[str, UUID] = {code: id_ for code, id_ in prop_rows}

        unit_rows = (
            await self._session.execute(
                select(UnitModel.code, UnitModel.id)
                .where(UnitModel.code.in_(unit_codes))
            )
        ).all()
        unit_map: dict[str, UUID] = {code: id_ for code, id_ in unit_rows}

        missing_props = property_codes - prop_map.keys()
        if missing_props:
            raise ValueError(f"ObservedProperties not found: {missing_props}")
        missing_units = unit_codes - unit_map.keys()
        if missing_units:
            raise ValueError(f"Units not found: {missing_units}")

        stmt = (
            insert(DatastreamModel)
            .values([
                {
                    "id": ds.id,
                    "sensor_id": UUID(ds.device_id.value),
                    "observed_property_id": prop_map[ds.observed_property_code],
                    "unit_id": unit_map[ds.unit_code],
                    "name": ds.observed_property_code,
                }
                for ds in datastreams
            ])
            .on_conflict_do_nothing()
        )
        await self._session.execute(stmt)
        await self._session.flush()
