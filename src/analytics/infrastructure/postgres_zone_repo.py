from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.zone import Zone
from .orm_models import ZoneModel


class PostgresZoneRepository:
    """
    Adaptador de persistencia y lectura para zonas geograficas.
    El calculo de sensores dentro de la zona usa haversine SQL.
    Depende de la tabla zones creada por migracion pendiente.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, zone: Zone) -> None:
        """Inserta una nueva zona en la BD."""
        model = ZoneModel(
            id=zone.id,
            workspace_id=zone.workspace_id,
            name=zone.name,
            center_lat=zone.center_lat,
            center_lon=zone.center_lon,
            radius_m=zone.radius_m,
            created_by=zone.created_by,
        )
        self._session.add(model)
        await self._session.flush()

    async def find_by_id(self, zone_id: UUID) -> Zone | None:
        """Retorna la zona por ID o None si no existe."""
        model = await self._session.get(ZoneModel, zone_id)
        if model is None:
            return None
        return self._to_domain(model)

    async def find_by_workspace(self, workspace_id: UUID) -> list[Zone]:
        """Retorna todas las zonas del workspace."""
        stmt = select(ZoneModel).where(ZoneModel.workspace_id == workspace_id)
        rows = (await self._session.execute(stmt)).scalars().all()
        return [self._to_domain(r) for r in rows]

    async def find_health(self, zone: Zone, from_dt: datetime, to_dt: datetime) -> list[dict]:
        """
        Retorna el promedio de cada variable en el rango temporal indicado
        para las mediciones tomadas dentro del radio de la zona.
        Usa la posicion historica del sensor en el momento de la medicion,
        no la posicion actual — un sensor movil sigue aportando a la zona
        donde estaba cuando midio.
        """
        query = text("""
            SELECT
                op.code        AS property_code,
                AVG(o.result)  AS avg_value
            FROM observations o
            JOIN datastreams ds  ON o.datastream_id = ds.id
            JOIN observed_properties op ON ds.observed_property_id = op.id
            JOIN sensors s      ON ds.sensor_id = s.id
            JOIN LATERAL (
                SELECT latitude, longitude
                FROM historical_locations hl
                WHERE hl.sensor_id = s.id
                  AND hl.recorded_at <= o.phenomenon_time
                ORDER BY hl.recorded_at DESC
                LIMIT 1
            ) loc ON true
            WHERE s.workspace_id = :workspace_id
              AND o.phenomenon_time >= :from_dt
              AND o.phenomenon_time <= :to_dt
              AND o.qualifier != 'SENSOR_OUT_OF_RANGE'
              AND (
                6371000 * acos(
                  LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(loc.latitude)) *
                    cos(radians(loc.longitude) - radians(:lon)) +
                    sin(radians(:lat)) * sin(radians(loc.latitude))
                  )
                )
              ) <= :radius_m
            GROUP BY op.code
        """)
        params = {
            "workspace_id": zone.workspace_id,
            "lat": zone.center_lat,
            "lon": zone.center_lon,
            "radius_m": zone.radius_m,
            "from_dt": from_dt,
            "to_dt": to_dt,
        }
        rows = (await self._session.execute(query, params)).mappings().all()
        return [dict(r) for r in rows]

    async def update(
        self,
        zone_id: UUID,
        name: str | None,
        center_lat: float | None,
        center_lon: float | None,
        radius_m: float | None,
    ) -> None:
        """Actualiza solo los campos no None de la zona."""
        values: dict = {}
        if name is not None:
            values["name"] = name
        if center_lat is not None:
            values["center_lat"] = center_lat
        if center_lon is not None:
            values["center_lon"] = center_lon
        if radius_m is not None:
            values["radius_m"] = radius_m
        if not values:
            return
        stmt = update(ZoneModel).where(ZoneModel.id == zone_id).values(**values)
        await self._session.execute(stmt)
        await self._session.flush()

    async def delete(self, zone_id: UUID) -> None:
        """Elimina la zona por ID."""
        stmt = delete(ZoneModel).where(ZoneModel.id == zone_id)
        await self._session.execute(stmt)
        await self._session.flush()

    def _to_domain(self, model: ZoneModel) -> Zone:
        """Convierte el modelo ORM a la entidad de dominio."""
        return Zone(
            id=model.id,
            workspace_id=model.workspace_id,
            name=model.name,
            center_lat=model.center_lat,
            center_lon=model.center_lon,
            radius_m=model.radius_m,
            created_by=model.created_by,
            created_at=model.created_at,
        )
