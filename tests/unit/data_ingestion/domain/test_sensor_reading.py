from __future__ import annotations

from datetime import datetime, timezone

import pytest

from src.data_ingestion.domain.sensor_reading import SensorReading


def _dt():
    return datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


def test_valid_reading():
    r = SensorReading(variable_code="pm2_5", value=35.0, phenomenon_time=_dt(), has_error=False)
    assert r.value == 35.0
    assert not r.has_error


def test_naive_datetime_raises():
    with pytest.raises(ValueError, match="timezone-aware"):
        SensorReading(
            variable_code="pm2_5",
            value=35.0,
            phenomenon_time=datetime(2026, 1, 1, 12, 0, 0),
            has_error=False,
        )
