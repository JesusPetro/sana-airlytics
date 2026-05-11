from __future__ import annotations

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.infrastructure.orm_models import HistoricalLocationModel, LocationModel, ObservationModel, UnitModel
from src.data_ingestion.infrastructure.orm_models import DatastreamModel, ObservedPropertyModel


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
        contaminant: str | None = None,
    ) -> list[dict]:
        """
        Retorna la trayectoria historica del sensor en el rango temporal indicado.
        Si se indica contaminant, hace LEFT JOIN con observations para incluir
        el valor de esa variable en cada punto (una sola query).
        """
        if contaminant:
            # Misma lógica que find_snapshot: busca el valor más cercano
            # en ±30s. Embebida como subconsulta correlacionada para que
            # sea una sola query sin importar cuántos puntos haya.
            # Los códigos en DB son uppercase (PM2_5, CO2…), el frontend
            # manda lowercase — normalizamos acá.
            window = timedelta(seconds=30)
            value_subq = (
                select(ObservationModel.result)
                .join(DatastreamModel, ObservationModel.datastream_id == DatastreamModel.id)
                .join(
                    ObservedPropertyModel,
                    DatastreamModel.observed_property_id == ObservedPropertyModel.id,
                )
                .where(
                    DatastreamModel.sensor_id == sensor_id,
                    ObservedPropertyModel.code == contaminant.upper(),
                    ObservationModel.phenomenon_time.between(
                        HistoricalLocationModel.recorded_at - window,
                        HistoricalLocationModel.recorded_at + window,
                    ),
                )
                .correlate(HistoricalLocationModel)
                .order_by(ObservationModel.phenomenon_time.asc())
                .limit(1)
                .scalar_subquery()
            )

            stmt = (
                select(
                    HistoricalLocationModel.latitude,
                    HistoricalLocationModel.longitude,
                    HistoricalLocationModel.elevation,
                    HistoricalLocationModel.recorded_at,
                    value_subq.label("contaminant_value"),
                )
                .where(
                    HistoricalLocationModel.sensor_id == sensor_id,
                    HistoricalLocationModel.recorded_at >= from_dt,
                    HistoricalLocationModel.recorded_at <= to_dt,
                )
                .order_by(HistoricalLocationModel.recorded_at.asc())
            )
        else:
            stmt = (
                select(
                    HistoricalLocationModel.latitude,
                    HistoricalLocationModel.longitude,
                    HistoricalLocationModel.elevation,
                    HistoricalLocationModel.recorded_at,
                )
                .where(
                    HistoricalLocationModel.sensor_id == sensor_id,
                    HistoricalLocationModel.recorded_at >= from_dt,
                    HistoricalLocationModel.recorded_at <= to_dt,
                )
                .order_by(HistoricalLocationModel.recorded_at.asc())
            )

        rows = (await self._session.execute(stmt)).mappings().all()
        return [
            {
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "elevation": r["elevation"],
                "recorded_at": r["recorded_at"],
                "contaminant_value": r.get("contaminant_value"),
            }
            for r in rows
        ]

    async def find_snapshot(
        self,
        sensor_id: UUID,
        at_dt: datetime | None,
        window_seconds: int = 30,
    ) -> list[dict]:
        """
        Retorna todas las variables del sensor cuyo phenomenon_time caiga
        dentro de [at_dt - window, at_dt + window].
        Si at_dt es None, busca la observación más reciente del sensor y usa
        su phenomenon_time como pivote.
        """
        if at_dt is None:
            # Obtener el phenomenon_time de la observacion mas reciente del sensor
            latest_stmt = (
                select(ObservationModel.phenomenon_time)
                .join(DatastreamModel, ObservationModel.datastream_id == DatastreamModel.id)
                .where(DatastreamModel.sensor_id == sensor_id)
                .order_by(ObservationModel.phenomenon_time.desc())
                .limit(1)
            )
            latest = (await self._session.execute(latest_stmt)).scalar_one_or_none()
            if latest is None:
                return []
            at_dt = latest

        window = timedelta(seconds=window_seconds)
        stmt = (
            select(
                ObservedPropertyModel.code.label("property_code"),
                ObservedPropertyModel.name.label("property_name"),
                UnitModel.symbol.label("unit_symbol"),
                ObservationModel.result,
                ObservationModel.qualifier,
                ObservationModel.phenomenon_time,
            )
            .join(DatastreamModel, ObservationModel.datastream_id == DatastreamModel.id)
            .join(
                ObservedPropertyModel,
                DatastreamModel.observed_property_id == ObservedPropertyModel.id,
            )
            .join(UnitModel, DatastreamModel.unit_id == UnitModel.id)
            .where(
                DatastreamModel.sensor_id == sensor_id,
                ObservationModel.phenomenon_time >= at_dt - window,
                ObservationModel.phenomenon_time <= at_dt + window,
            )
            .order_by(ObservedPropertyModel.code.asc())
        )
        rows = (await self._session.execute(stmt)).mappings().all()

        seen: set[str] = set()
        result: list[dict] = []
        for r in rows:
            if r["property_code"] not in seen:
                seen.add(r["property_code"])
                result.append(dict(r))
        return result

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
