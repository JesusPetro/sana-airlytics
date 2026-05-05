from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    ObservedPropertyModel,
    UnitModel,
)
from src.device_management.infrastructure.orm_models import SensorModel


class PostgresDatastreamReadRepository:
    """
    Adaptador de lectura para datastreams del workspace.
    Hace join entre sensors, datastreams, observed_properties y units.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_workspace(self, workspace_id: UUID) -> list[dict]:
        """
        Retorna todos los datastreams activos de los sensores
        pertenecientes al workspace indicado.
        """
        stmt = (
            select(
                DatastreamModel.id,
                DatastreamModel.name,
                DatastreamModel.description,
                DatastreamModel.sensor_id,
                DatastreamModel.status,
                DatastreamModel.phenomenon_time_start,
                DatastreamModel.phenomenon_time_end,
                ObservedPropertyModel.code.label("property_code"),
                ObservedPropertyModel.name.label("property_name"),
                UnitModel.code.label("unit_code"),
                UnitModel.symbol.label("unit_symbol"),
                SensorModel.code.label("sensor_code"),
                SensorModel.name.label("sensor_name"),
            )
            .join(SensorModel, DatastreamModel.sensor_id == SensorModel.id)
            .join(
                ObservedPropertyModel,
                DatastreamModel.observed_property_id == ObservedPropertyModel.id,
            )
            .join(UnitModel, DatastreamModel.unit_id == UnitModel.id)
            .where(
                SensorModel.workspace_id == workspace_id,
                SensorModel.deleted_at.is_(None),
                DatastreamModel.status == "active",
            )
        )
        rows = (await self._session.execute(stmt)).mappings().all()
        return [dict(r) for r in rows]
