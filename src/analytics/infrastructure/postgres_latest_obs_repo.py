from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.ports.repositories import LatestObservationDTO
from shared.infrastructure.logger import get_logger

logger = get_logger(__name__)

_LATEST_OBS_QUERY = text("""
    SELECT DISTINCT ON (d.id)
        o.result         AS value,
        o.phenomenon_time AS observed_at,
        o.qualifier,
        d.id             AS datastream_id,
        d.sensor_id,
        s.name           AS sensor_name,
        op.code          AS property_code,
        u.symbol         AS unit_symbol
    FROM observations o
    JOIN datastreams d   ON d.id = o.datastream_id
    JOIN sensors s       ON s.id = d.sensor_id
    JOIN units u         ON u.id = d.unit_id
    JOIN observed_properties op ON op.id = d.observed_property_id
    WHERE s.workspace_id = :workspace_id
      AND d.unit_id      = :unit_id
      AND d.status       = 'active'
      AND s.deleted_at   IS NULL
    ORDER BY d.id, o.phenomenon_time DESC
""")


class PostgresLatestObservationRepository:
    """
    Adaptador de lectura para la observacion mas reciente por datastream.
    El JOIN contra datastreams y sensors es interno — el worker no importa
    ningun modelo de data_ingestion.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_latest_by_unit(
        self,
        workspace_id: UUID,
        unit_id: UUID,
    ) -> list[LatestObservationDTO]:
        """
        Retorna la observacion mas reciente de cada datastream activo
        del workspace cuya unidad coincide con unit_id.
        Incluye todos los qualifiers — el caso de uso decide que hacer
        con cada uno.
        """
        rows = (
            await self._session.execute(
                _LATEST_OBS_QUERY,
                {"workspace_id": workspace_id, "unit_id": unit_id},
            )
        ).mappings().all()
        return [
            LatestObservationDTO(
                datastream_id=r["datastream_id"],
                sensor_id=r["sensor_id"],
                sensor_name=r["sensor_name"],
                property_code=r["property_code"],
                unit_symbol=r["unit_symbol"],
                value=r["value"],
                qualifier=r["qualifier"],
                observed_at=r["observed_at"],
            )
            for r in rows
        ]
