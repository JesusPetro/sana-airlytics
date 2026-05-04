from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class PostgresObservationReadRepository:
    """
    Adaptador de lectura para series temporales de observaciones.
    Usa la hypertable observations para series crudas y la vista
    materializada observations_hourly para agregaciones.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_series(
        self,
        datastream_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
        qualifier: str | None,
        exclude_oor: bool,
    ) -> list[dict]:
        """
        Retorna la serie temporal cruda de un datastream con filtros opcionales.
        exclude_oor filtra observaciones con qualifier = 'SENSOR_OUT_OF_RANGE'.
        """
        filters = [
            "datastream_id = :ds_id",
            "phenomenon_time >= :from_dt",
            "phenomenon_time <= :to_dt",
        ]
        if qualifier:
            filters.append("qualifier = :qualifier")
        if exclude_oor:
            filters.append("qualifier != 'SENSOR_OUT_OF_RANGE'")

        where_clause = " AND ".join(filters)
        query = text(
            f"SELECT phenomenon_time, result, qualifier "
            f"FROM observations "
            f"WHERE {where_clause} "
            f"ORDER BY phenomenon_time ASC"
        )
        params: dict = {
            "ds_id": datastream_id,
            "from_dt": from_dt,
            "to_dt": to_dt,
        }
        if qualifier:
            params["qualifier"] = qualifier

        rows = (await self._session.execute(query, params)).mappings().all()
        return [dict(r) for r in rows]

    async def find_aggregations(
        self,
        datastream_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
        bucket: str,
    ) -> list[dict]:
        """
        Retorna agregaciones avg/min/max/count por bucket temporal.
        bucket='1h' usa la vista materializada observations_hourly.
        bucket='1d' agrupa la vista horaria por dia via date_trunc.
        """
        if bucket == "1h":
            query = text(
                "SELECT bucket, avg_value, min_value, max_value, sample_count "
                "FROM observations_hourly "
                "WHERE datastream_id = :ds_id "
                "AND bucket >= :from_dt AND bucket <= :to_dt "
                "ORDER BY bucket ASC"
            )
        else:
            # Agregacion diaria calculada sobre la vista horaria
            query = text(
                "SELECT date_trunc('day', bucket) AS bucket, "
                "AVG(avg_value) AS avg_value, "
                "MIN(min_value) AS min_value, "
                "MAX(max_value) AS max_value, "
                "SUM(sample_count) AS sample_count "
                "FROM observations_hourly "
                "WHERE datastream_id = :ds_id "
                "AND bucket >= :from_dt AND bucket <= :to_dt "
                "GROUP BY date_trunc('day', bucket) "
                "ORDER BY bucket ASC"
            )
        params = {"ds_id": datastream_id, "from_dt": from_dt, "to_dt": to_dt}
        rows = (await self._session.execute(query, params)).mappings().all()
        return [dict(r) for r in rows]
