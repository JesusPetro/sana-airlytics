from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.infrastructure.orm_models import HistoricalLocationModel, LocationModel


class PostgresLocationReadRepository:
    """
    Adaptador de lectura para ubicacion actual y trayectoria historica de sensores.
    Heatmap usa haversine SQL para calcular puntos cercanos por workspace.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_current_location(self, sensor_id: UUID) -> dict | None:
        """Retorna la ubicacion actual del sensor o None si no tiene."""
        stmt = select(LocationModel).where(LocationModel.sensor_id == sensor_id)
        model = (await self._session.execute(stmt)).scalar_one_or_none()
        if model is None:
            return None
        return {
            "sensor_id": str(model.sensor_id),
            "latitude": model.latitude,
            "longitude": model.longitude,
            "elevation": model.elevation,
            "updated_at": model.updated_at,
        }

    async def find_track(
        self,
        sensor_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
    ) -> list[dict]:
        """
        Retorna la trayectoria historica del sensor en el rango temporal indicado.
        """
        stmt = (
            select(HistoricalLocationModel)
            .where(
                HistoricalLocationModel.sensor_id == sensor_id,
                HistoricalLocationModel.recorded_at >= from_dt,
                HistoricalLocationModel.recorded_at <= to_dt,
            )
            .order_by(HistoricalLocationModel.recorded_at.asc())
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [
            {
                "latitude": r.latitude,
                "longitude": r.longitude,
                "elevation": r.elevation,
                "recorded_at": r.recorded_at,
            }
            for r in rows
        ]

    async def find_heatmap_points(
        self,
        workspace_id: UUID,
        property_code: str,
        from_dt: datetime,
        to_dt: datetime,
    ) -> list[dict]:
        """
        Retorna puntos de mapa de calor: lat/lon del sensor con el promedio
        de la variable indicada en el rango temporal. Filtra solo sensores
        con ubicacion registrada y pertenecientes al workspace.
        """
        query = text("""
            SELECT
                l.latitude,
                l.longitude,
                AVG(o.result) AS avg_value
            FROM observations o
            JOIN datastreams ds ON o.datastream_id = ds.id
            JOIN observed_properties op ON ds.observed_property_id = op.id
            JOIN sensors s ON ds.sensor_id = s.id
            JOIN locations l ON l.sensor_id = s.id
            WHERE s.workspace_id = :workspace_id
              AND op.code = :property_code
              AND o.phenomenon_time >= :from_dt
              AND o.phenomenon_time <= :to_dt
              AND o.qualifier != 'SENSOR_OUT_OF_RANGE'
            GROUP BY l.latitude, l.longitude
        """)
        params = {
            "workspace_id": workspace_id,
            "property_code": property_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
        }
        rows = (await self._session.execute(query, params)).mappings().all()
        return [dict(r) for r in rows]
