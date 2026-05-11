from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import literal_column, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from device_management.domain.device import Device
from device_management.domain.device_config import DeviceConfig
from device_management.domain.device_location import DeviceLocation
from device_management.domain.device_status import DeviceStatus
from device_management.domain.site_type import SiteType
from shared.domain.device_id import DeviceId

from shared.infrastructure.orm_models import LocationModel

from .orm_models import SensorModel


class PostgresDeviceRepository:
    """Implementacion PostgreSQL de DeviceRepository."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, device: Device) -> None:
        """Upsert del device y su location si existe."""
        sensor_stmt = insert(SensorModel).values(
            id=UUID(device.id.value),
            code=device.code,
            name=device.name,
            model=device.model,
            site_type=device.site_type.value if device.site_type else None,
            status=device.status.value,
            deactivated_at=device.deactivated_at,
            sampling_interval_seconds=device.config.sampling_interval_seconds,
            transmission_interval_seconds=device.config.transmission_interval_seconds,
            workspace_id=UUID(device.workspace_id) if device.workspace_id is not None else None,
        )
        await self._session.execute(
            sensor_stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={c.key: c for c in sensor_stmt.excluded if c.key != "id"},
            )
        )

        if device.location is not None:
            loc_stmt = insert(LocationModel).values(
                sensor_id=UUID(device.id.value),
                latitude=device.location.latitude,
                longitude=device.location.longitude,
                elevation=device.location.elevation,
            )
            await self._session.execute(
                loc_stmt.on_conflict_do_update(
                    index_elements=["sensor_id"],
                    set_={c.key: c for c in loc_stmt.excluded if c.key != "sensor_id"},
                )
            )

        await self._session.flush()

    async def find_by_id(self, device_id: DeviceId) -> Device | None:
        """Retorna None si el device no existe."""
        stmt = (
            select(SensorModel, LocationModel)
            .outerjoin(LocationModel, LocationModel.sensor_id == SensorModel.id)
            .where(SensorModel.id == UUID(device_id.value))
        )
        row = (await self._session.execute(stmt)).one_or_none()
        if row is None:
            return None
        sensor, loc = row
        return self._to_domain(sensor, loc)

    async def find_by_code(self, code: str) -> Device | None:
        """Busqueda por code (siempre uppercase en BD)."""
        stmt = (
            select(SensorModel, LocationModel)
            .outerjoin(LocationModel, LocationModel.sensor_id == SensorModel.id)
            .where(SensorModel.code == code.upper())
        )
        row = (await self._session.execute(stmt)).one_or_none()
        if row is None:
            return None
        sensor, loc = row
        return self._to_domain(sensor, loc)

    async def find_by_workspace(self, workspace_id: str) -> list[Device]:
        """Retorna devices del workspace no soft-deleted."""
        stmt = (
            select(SensorModel, LocationModel)
            .outerjoin(LocationModel, LocationModel.sensor_id == SensorModel.id)
            .where(
                SensorModel.workspace_id == UUID(workspace_id),
                SensorModel.deleted_at.is_(None),
            )
        )
        rows = (await self._session.execute(stmt)).all()
        return [self._to_domain(sensor, loc) for sensor, loc in rows]

    async def find_by_workspace_with_last_seen(
        self, workspace_id: str
    ) -> list[tuple[Device, datetime | None]]:
        """Retorna devices del workspace junto con el timestamp de su ultima observacion.

        Evita escribir last_seen en sensors; lo deriva en lectura via subquery
        sobre datastreams -> observations.
        """
        last_seen_expr = literal_column(
            "(SELECT MAX(o.phenomenon_time)"
            " FROM datastreams d"
            " JOIN observations o ON o.datastream_id = d.id"
            " WHERE d.sensor_id = sensors.id)"
        ).label("last_seen")

        stmt = (
            select(SensorModel, LocationModel, last_seen_expr)
            .outerjoin(LocationModel, LocationModel.sensor_id == SensorModel.id)
            .where(
                SensorModel.workspace_id == UUID(workspace_id),
                SensorModel.deleted_at.is_(None),
            )
        )
        rows = (await self._session.execute(stmt)).all()
        return [(self._to_domain(sensor, loc), last_seen) for sensor, loc, last_seen in rows]

    async def find_pending(self) -> list[Device]:
        """Retorna todos los devices en estado PENDING disponibles para reclamar."""
        stmt = (
            select(SensorModel, LocationModel)
            .outerjoin(LocationModel, LocationModel.sensor_id == SensorModel.id)
            .where(SensorModel.status == "PENDING")
            .where(SensorModel.deleted_at.is_(None))
        )
        rows = (await self._session.execute(stmt)).all()
        return [self._to_domain(sensor, loc) for sensor, loc in rows]

    def _to_domain(self, sensor: SensorModel, loc: LocationModel | None) -> Device:
        location = (
            DeviceLocation(
                latitude=loc.latitude,
                longitude=loc.longitude,
                elevation=loc.elevation,
            )
            if loc is not None
            else None
        )
        return Device.reconstitute(
            id=DeviceId(str(sensor.id)),
            code=sensor.code,
            name=sensor.name,
            model=sensor.model,
            workspace_id=str(sensor.workspace_id) if sensor.workspace_id is not None else None,
            status=DeviceStatus(sensor.status),
            site_type=SiteType(sensor.site_type) if sensor.site_type else None,
            config=DeviceConfig(
                sampling_interval_seconds=sensor.sampling_interval_seconds,
                transmission_interval_seconds=sensor.transmission_interval_seconds,
            ),
            location=location,
            created_at=sensor.created_at,
            deactivated_at=sensor.deactivated_at,
        )
