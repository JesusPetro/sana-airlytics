from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class RegisterDeviceRequest(BaseModel):
    """Datos para pre-registrar un device nuevo en estado PENDING."""

    code: str
    name: str
    model: str
    site_type: str | None = None
    sampling_interval_seconds: int = 30
    transmission_interval_seconds: int = 60


class RegisterDeviceResponse(BaseModel):
    """Identificadores del device registrado."""

    device_id: str
    code: str


class ClaimDeviceRequest(BaseModel):
    """Datos para reclamar un device PENDING y asignarlo a un workspace."""

    workspace_id: str


class UpdateDeviceConfigRequest(BaseModel):
    """Nuevos intervalos de muestreo y transmision para un device."""

    sampling_interval_seconds: int
    transmission_interval_seconds: int


class DeviceStatusResponse(BaseModel):
    """Estado completo de un device."""

    device_id: str
    code: str
    name: str
    model: str
    status: str
    sampling_interval_seconds: int
    transmission_interval_seconds: int
    keepalive_seconds: int
    last_seen: datetime | None
    deactivated_at: datetime | None
    site_type: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    elevation: float | None = None
