from __future__ import annotations

from datetime import datetime, timezone

import pytest

from src.data_ingestion.domain.measurement_validator import MeasurementValidator
from src.data_ingestion.domain.result_qualifier import ResultQualifier
from src.data_ingestion.domain.sensor_reading import SensorReading


def _reading(variable_code: str, value: float, has_error: bool = False) -> SensorReading:
    return SensorReading(
        variable_code=variable_code,
        value=value,
        phenomenon_time=datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
        has_error=has_error,
    )


@pytest.fixture
def validator():
    return MeasurementValidator()


# --- variable desconocida ---

def test_unknown_variable_returns_valid(validator):
    result = validator.validate(_reading("unknown_var", 42.0))
    assert result == ResultQualifier.VALID


# --- has_error ---

def test_has_error_returns_out_of_range(validator):
    result = validator.validate(_reading("pm2_5", 35.0, has_error=True))
    assert result == ResultQualifier.SENSOR_OUT_OF_RANGE


# --- valores centinela ---

def test_sentinel_value_pm_returns_out_of_range(validator):
    result = validator.validate(_reading("pm2_5", 6553.5))
    assert result == ResultQualifier.SENSOR_OUT_OF_RANGE


def test_sentinel_value_co2_returns_out_of_range(validator):
    result = validator.validate(_reading("co2", 65535.0))
    assert result == ResultQualifier.SENSOR_OUT_OF_RANGE


def test_sentinel_value_temperature_returns_out_of_range(validator):
    result = validator.validate(_reading("temperature", 163.835))
    assert result == ResultQualifier.SENSOR_OUT_OF_RANGE


# --- límite duro (datasheet) ---

def test_pm_above_hard_max_returns_out_of_range(validator):
    result = validator.validate(_reading("pm2_5", 1001.0))
    assert result == ResultQualifier.SENSOR_OUT_OF_RANGE


def test_temperature_below_hard_min_returns_out_of_range(validator):
    result = validator.validate(_reading("temperature", -11.0))
    assert result == ResultQualifier.SENSOR_OUT_OF_RANGE


# --- límite blando (Cartagena) ---

def test_pm_above_soft_max_returns_suspicious(validator):
    # soft_max = 500, hard_max = 1000 → en rango duro pero fuera del blando
    result = validator.validate(_reading("pm2_5", 600.0))
    assert result == ResultQualifier.SUSPICIOUS_VALUE


def test_temperature_above_soft_max_returns_suspicious(validator):
    # soft_max = 45, hard_max = 50
    result = validator.validate(_reading("temperature", 47.0))
    assert result == ResultQualifier.SUSPICIOUS_VALUE


def test_co2_below_soft_min_returns_suspicious(validator):
    # soft_min = 350, hard_min = 0
    result = validator.validate(_reading("co2", 100.0))
    assert result == ResultQualifier.SUSPICIOUS_VALUE


# --- valor válido ---

def test_pm2_5_valid_value(validator):
    result = validator.validate(_reading("pm2_5", 35.0))
    assert result == ResultQualifier.VALID


def test_temperature_valid_value(validator):
    result = validator.validate(_reading("temperature", 28.0))
    assert result == ResultQualifier.VALID


def test_co2_valid_value(validator):
    result = validator.validate(_reading("co2", 800.0))
    assert result == ResultQualifier.VALID
