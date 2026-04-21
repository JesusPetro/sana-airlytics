from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class RegisterDeviceInput:
    code: str
    name: str
    model: str
    workspace_id: str
    site_type: str | None = None
    sampling_interval_seconds: int = 30
    transmission_interval_seconds: int = 60


@dataclass(frozen=True)
class RegisterDeviceOutput:
    device_id: str
    code: str


@dataclass(frozen=True)
class UpdateDeviceConfigInput:
    device_id: str
    sampling_interval_seconds: int
    transmission_interval_seconds: int


@dataclass(frozen=True)
class DeviceStatusOutput:
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
