from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class DatastreamResponse(BaseModel):
    """Resumen de un datastream para listados."""
    datastream_id: str
    name: str
    description: str | None
    sensor_id: str
    sensor_code: str
    sensor_name: str
    property_code: str
    property_name: str
    unit_code: str
    unit_symbol: str
    status: str
    phenomenon_time_start: datetime | None
    phenomenon_time_end: datetime | None


class ObservationPointResponse(BaseModel):
    """Un punto de serie temporal."""
    phenomenon_time: datetime
    result: float | None
    qualifier: str | None


class AggregationBucketResponse(BaseModel):
    """Un bucket de agregacion."""
    bucket: datetime
    avg_value: float | None
    min_value: float | None
    max_value: float | None
    sample_count: int


class LocationResponse(BaseModel):
    """Ubicacion actual de un sensor."""
    sensor_id: str
    latitude: float
    longitude: float
    elevation: float | None
    updated_at: datetime


class TrackPointResponse(BaseModel):
    """Un punto de trayectoria historica."""
    latitude: float
    longitude: float
    elevation: float | None
    recorded_at: datetime


class HeatmapPointResponse(BaseModel):
    """Un punto del mapa de calor."""
    latitude: float
    longitude: float
    avg_value: float


class CreateAnnotationRequest(BaseModel):
    """Datos para crear una anotacion."""
    entity_type: str
    entity_id: str
    body: str


class AnnotationResponse(BaseModel):
    """Representacion de una anotacion."""
    annotation_id: str
    entity_type: str
    entity_id: str
    body: str
    created_by: str
    created_at: datetime


class CreateAlertRuleRequest(BaseModel):
    """Datos para crear una regla de alerta."""
    unit_id: str | None = None
    name: str
    metric: str
    operator: str | None = None
    threshold: float | None = None


class UpdateAlertRuleRequest(BaseModel):
    """Activar o desactivar una regla de alerta."""
    is_active: bool


class AlertRuleResponse(BaseModel):
    """Representacion de una regla de alerta."""
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


class AlertEventResponse(BaseModel):
    """Representacion de un evento de alerta."""
    event_id: str
    alert_rule_id: str
    triggered_at: datetime
    resolved_at: datetime | None
    value: float | None
    message: str


class CreateZoneRequest(BaseModel):
    """Datos para crear una zona geografica."""
    name: str
    center_lat: float
    center_lon: float
    radius_m: float


class ZoneResponse(BaseModel):
    """Representacion de una zona."""
    zone_id: str
    workspace_id: str
    name: str
    center_lat: float
    center_lon: float
    radius_m: float
    created_by: str
    created_at: datetime


class ZoneHealthVariableResponse(BaseModel):
    """Veredicto de una variable en la zona."""
    property_code: str
    avg_value: float
    verdict: str


class ZoneHealthResponse(BaseModel):
    """Veredicto de calidad del aire de una zona."""
    zone_id: str
    zone_name: str
    overall_verdict: str
    variables: list[ZoneHealthVariableResponse]
    evaluated_hours: int
