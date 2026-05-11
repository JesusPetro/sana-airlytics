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

    _BUCKET_INTERVALS: dict[str, str] = {
        "5m":  "5 minutes",
        "15m": "15 minutes",
        "30m": "30 minutes",
        "1h":  "1 hour",
        "6h":  "6 hours",
        "1d":  "1 day",
    }

    async def find_aggregations(
        self,
        datastream_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
        bucket: str,
    ) -> list[dict]:
        """
        Retorna agregaciones avg/min/max/count por bucket temporal usando
        time_bucket() sobre la hypertable raw. Soporta buckets: 5m, 15m, 30m, 1h, 6h, 1d.
        """
        interval = self._BUCKET_INTERVALS[bucket]
        query = text(
            f"SELECT time_bucket(INTERVAL '{interval}', phenomenon_time) AS bucket, "
            "AVG(result)   AS avg_value, "
            "MIN(result)   AS min_value, "
            "MAX(result)   AS max_value, "
            "COUNT(*)      AS sample_count "
            "FROM observations "
            "WHERE datastream_id = :ds_id "
            "AND phenomenon_time >= :from_dt AND phenomenon_time <= :to_dt "
            f"GROUP BY time_bucket(INTERVAL '{interval}', phenomenon_time) "
            "ORDER BY bucket ASC"
        )
        params = {"ds_id": datastream_id, "from_dt": from_dt, "to_dt": to_dt}
        rows = (await self._session.execute(query, params)).mappings().all()
        return [dict(r) for r in rows]
