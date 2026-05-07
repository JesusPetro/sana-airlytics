from __future__ import annotations

from datetime import datetime
from typing import Protocol
from uuid import UUID

from ..alert_event import AlertEvent
from ..alert_rule import AlertRule
from ..annotation import Annotation
from ..zone import Zone


class DatastreamReadRepository(Protocol):
    """Puerto de lectura para datastreams del workspace."""

    async def find_by_workspace(self, workspace_id: UUID) -> list[dict]: ...


class ObservationReadRepository(Protocol):
    """Puerto de lectura para series temporales de observaciones."""

    async def find_series(
        self,
        datastream_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
        qualifier: str | None,
        exclude_oor: bool,
    ) -> list[dict]: ...

    async def find_aggregations(
        self,
        datastream_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
        bucket: str,
    ) -> list[dict]: ...


class LocationReadRepository(Protocol):
    """Puerto de lectura para ubicacion y trayectoria de sensores."""

    async def find_current_location(self, sensor_id: UUID) -> dict | None: ...

    async def find_track(
        self,
        sensor_id: UUID,
        from_dt: datetime,
        to_dt: datetime,
    ) -> list[dict]: ...

    async def find_heatmap_points(
        self,
        workspace_id: UUID,
        property_code: str,
        from_dt: datetime,
        to_dt: datetime,
    ) -> list[dict]: ...


class AnnotationRepository(Protocol):
    """Puerto de persistencia y lectura de anotaciones."""

    async def save(self, annotation: Annotation) -> None: ...

    async def find_by_entity(
        self,
        workspace_id: UUID,
        entity_type: str | None,
        entity_id: UUID | None,
    ) -> list[Annotation]: ...

    async def find_by_id(self, annotation_id: UUID) -> Annotation | None: ...

    async def update_body(self, annotation_id: UUID, body: str) -> None: ...

    async def delete(self, annotation_id: UUID) -> None: ...


class AlertRuleRepository(Protocol):
    """Puerto de persistencia y lectura de reglas de alerta."""

    async def save(self, rule: AlertRule) -> None: ...
    async def find_by_id(self, rule_id: UUID) -> AlertRule | None: ...
    async def find_by_workspace(self, workspace_id: UUID) -> list[AlertRule]: ...
    async def find_active(self) -> list[AlertRule]: ...
    async def delete(self, rule_id: UUID) -> None: ...


class AlertEventRepository(Protocol):
    """Puerto de lectura de eventos de alerta."""

    async def find_by_workspace(
        self,
        workspace_id: UUID,
        from_dt: datetime | None,
        to_dt: datetime | None,
    ) -> list[AlertEvent]: ...


class ZoneRepository(Protocol):
    """Puerto de persistencia y lectura de zonas geograficas."""

    async def save(self, zone: Zone) -> None: ...
    async def find_by_id(self, zone_id: UUID) -> Zone | None: ...
    async def find_by_workspace(self, workspace_id: UUID) -> list[Zone]: ...

    async def find_health(
        self,
        zone: Zone,
        hours: int,
    ) -> list[dict]: ...

    async def update(
        self,
        zone_id: UUID,
        name: str | None,
        center_lat: float | None,
        center_lon: float | None,
        radius_m: float | None,
    ) -> None: ...

    async def delete(self, zone_id: UUID) -> None: ...
