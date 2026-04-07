from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from src.data_ingestion.domain.measurement_batch import HardwareMetadata, MeasurementBatch
from src.data_ingestion.domain.sensor_reading import SensorReading
from src.shared.domain.device_id import DeviceId


def _dt():
    return datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


def _reading():
    return SensorReading(
        variable_code="pm2_5",
        value=35.0,
        phenomenon_time=_dt(),
        has_error=False,
    )


def _metadata():
    return HardwareMetadata(battery_pct=85, rssi_dbm=-70, uptime_s=3600, gps=None)


def test_valid_batch():
    batch = MeasurementBatch(
        message_id=uuid.uuid7(),
        device_id=DeviceId.generate(),
        received_at=_dt(),
        readings=[_reading()],
        metadata=_metadata(),
    )
    assert len(batch.readings) == 1


def test_naive_received_at_raises():
    with pytest.raises(ValueError, match="timezone-aware"):
        MeasurementBatch(
            message_id=uuid.uuid7(),
            device_id=DeviceId.generate(),
            received_at=datetime(2026, 1, 1, 12, 0, 0),
            readings=[_reading()],
            metadata=_metadata(),
        )
