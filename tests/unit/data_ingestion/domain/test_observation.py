from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone

import pytest

from src.data_ingestion.domain.observation import Observation
from src.data_ingestion.domain.result_qualifier import ResultQualifier


def _dt():
    return datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


def _obs(**kwargs):
    defaults = dict(
        id=uuid.uuid7(),
        datastream_id=uuid.uuid7(),
        phenomenon_time=_dt(),
        result_time=_dt(),
        result=25.0,
        qualifier=ResultQualifier.VALID,
    )
    return Observation(**{**defaults, **kwargs})


def test_valid_observation():
    obs = _obs()
    assert obs.result == 25.0
    assert obs.qualifier == ResultQualifier.VALID


def test_observation_with_qualifier():
    obs = _obs(qualifier=ResultQualifier.SUSPICIOUS_VALUE)
    assert obs.qualifier == ResultQualifier.SUSPICIOUS_VALUE


def test_infinite_result_raises():
    with pytest.raises(ValueError, match="finite"):
        _obs(result=math.inf)


def test_nan_result_raises():
    with pytest.raises(ValueError, match="finite"):
        _obs(result=math.nan)


def test_naive_phenomenon_time_raises():
    with pytest.raises(ValueError, match="timezone-aware"):
        _obs(phenomenon_time=datetime(2026, 1, 1, 12, 0, 0))


def test_naive_result_time_raises():
    with pytest.raises(ValueError, match="timezone-aware"):
        _obs(result_time=datetime(2026, 1, 1, 12, 0, 0))
