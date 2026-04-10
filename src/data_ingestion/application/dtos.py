from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class DeviceRegisteredEventDTO:
    device_id: str
    model: str


@dataclass(frozen=True)
class VariableReadingDTO:
    value: float
    error: bool


@dataclass(frozen=True)
class GpsDTO:
    lat: float
    lon: float
    alt: float


@dataclass(frozen=True)
class HardwareMetadataDTO:
    battery_pct: int
    rssi_dbm: int
    uptime_s: int
    gps: GpsDTO | None


@dataclass(frozen=True)
class SensorReadingDTO:
    timestamp: datetime
    pm1: VariableReadingDTO
    pm2_5: VariableReadingDTO
    pm4: VariableReadingDTO
    pm10: VariableReadingDTO
    temperature: VariableReadingDTO
    humidity: VariableReadingDTO
    voc_index: VariableReadingDTO
    nox_index: VariableReadingDTO
    co2: VariableReadingDTO


@dataclass(frozen=True)
class IngestBatchDTO:
    message_id: str
    device_id: str
    readings: list[SensorReadingDTO]
    metadata: HardwareMetadataDTO
