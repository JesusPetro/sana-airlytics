from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from shared.domain.coordinate import Coordinate
from shared.domain.device_id import DeviceId

from .sensor_reading import SensorReading


@dataclass(frozen=True)
class HardwareMetadata:
    # TODO: revisar la opción de usar firmware_version
    battery_pct: int
    rssi_dbm: int
    uptime_s: int
    gps: Coordinate | None


@dataclass(frozen=True)
class MeasurementBatch:
    message_id: UUID
    device_id: DeviceId
    received_at: datetime
    readings: list[SensorReading]
    metadata: HardwareMetadata

    def __post_init__(self):
        if self.received_at.tzinfo is None:
            raise ValueError("received_at must be timezone-aware")

