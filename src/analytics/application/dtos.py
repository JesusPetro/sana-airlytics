from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


# --- Datastreams ---

@dataclass(frozen=True)
class DatastreamDTO:
    """Representacion de un datastream para la capa API."""
    datastream_id: str
    name: str
    description: str | None
    sensor_id: str
    unit_id: str
    sensor_code: str
    sensor_name: str
    property_code: str
    property_name: str
    unit_code: str
    unit_symbol: str
    status: str
    phenomenon_time_start: datetime | None
    phenomenon_time_end: datetime | None


# --- Observaciones ---

@dataclass(frozen=True)
class ObservationPointDTO:
    """Un punto de la serie temporal."""
    phenomenon_time: datetime
    result: float | None
    qualifier: str | None


@dataclass(frozen=True)
class AggregationBucketDTO:
    """Un bucket de agregacion temporal."""
    bucket: datetime
    avg_value: float | None
    min_value: float | None
    max_value: float | None
    sample_count: int


# --- Geovisualizacion ---

@dataclass(frozen=True)
class LocationDTO:
    """Ubicacion actual de un sensor."""
    sensor_id: str
    latitude: float
    longitude: float
    elevation: float | None
    updated_at: datetime


@dataclass(frozen=True)
class TrackPointDTO:
    """Un punto de la trayectoria historica."""
    latitude: float
    longitude: float
    elevation: float | None
    recorded_at: datetime
    contaminant_value: float | None = None


@dataclass(frozen=True)
class HeatmapPointDTO:
    """Un punto del mapa de calor."""
    latitude: float
    longitude: float
    avg_value: float


@dataclass(frozen=True)
class SnapshotVariableDTO:
    """Una variable dentro de un snapshot de medicion."""
    property_code: str
    property_name: str
    result: float | None
    unit_symbol: str
    qualifier: str | None


@dataclass(frozen=True)
class SnapshotDTO:
    """Snapshot de todas las variables de un sensor en un instante."""
    sensor_id: str
    phenomenon_time: datetime
    variables: list[SnapshotVariableDTO]


# --- Anotaciones ---

@dataclass(frozen=True)
class CreateAnnotationInput:
    """Datos para crear una anotacion."""
    workspace_id: str
    entity_type: str
    entity_id: str
    body: str
    created_by: str


@dataclass(frozen=True)
class AnnotationDTO:
    """Representacion de una anotacion para la capa API."""
    annotation_id: str
    entity_type: str
    entity_id: str
    body: str
    created_by: str
    created_at: datetime


# --- Alertas ---

@dataclass(frozen=True)
class CreateAlertRuleInput:
    """Datos para crear una regla de alerta."""
    workspace_id: str
    unit_id: str | None
    name: str
    metric: str
    operator: str | None
    threshold: float | None
    created_by: str


@dataclass(frozen=True)
class UpdateAlertRuleInput:
    """Campos a actualizar en una regla de alerta. Solo los no-None se aplican."""
    rule_id: str
    is_active: bool | None = None
    name: str | None = None
    operator: str | None = None
    threshold: float | None = None


@dataclass(frozen=True)
class AlertRuleDTO:
    """Representacion de una regla de alerta para la capa API."""
    rule_id: str
    workspace_id: str
    unit_id: str | None
    name: str
    metric: str
    operator: str | None
    threshold: float | None
    is_active: bool
    created_by: str
    created_at: datetime


@dataclass(frozen=True)
class AlertEventDTO:
    """Representacion de un evento de alerta para la capa API."""
    event_id: str
    alert_rule_id: str
    triggered_at: datetime
    resolved_at: datetime | None
    value: float | None
    message: str


# --- Zonas ---

@dataclass(frozen=True)
class CreateZoneInput:
    """Datos para crear una zona geografica."""
    workspace_id: str
    name: str
    center_lat: float
    center_lon: float
    radius_m: float
    created_by: str


@dataclass(frozen=True)
class UpdateZoneInput:
    """Datos parciales para editar una zona. Solo los campos presentes se actualizan."""
    zone_id: str
    name: str | None = None
    center_lat: float | None = None
    center_lon: float | None = None
    radius_m: float | None = None


@dataclass(frozen=True)
class ZoneDTO:
    """Representacion de una zona para la capa API."""
    zone_id: str
    workspace_id: str
    name: str
    center_lat: float
    center_lon: float
    radius_m: float
    created_by: str
    created_at: datetime


@dataclass(frozen=True)
class ZoneHealthDTO:
    """Veredicto de calidad del aire para una zona."""
    zone_id: str
    zone_name: str
    overall_verdict: str          # 'good' | 'moderate' | 'poor' | 'unknown'
    variables: list[dict]         # [{property_code, avg_value, verdict}]
    evaluated_hours: int
