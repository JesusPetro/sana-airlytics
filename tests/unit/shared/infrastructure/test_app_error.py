from __future__ import annotations

import pytest

from src.shared.infrastructure.app_error import (
    AppError,
    ConflictError,
    MeasurementOutOfRangeError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)


class TestHierarchy:
    def test_all_errors_inherit_from_app_error(self):
        assert issubclass(NotFoundError, AppError)
        assert issubclass(ValidationError, AppError)
        assert issubclass(ConflictError, AppError)
        assert issubclass(UnauthorizedError, AppError)
        assert issubclass(MeasurementOutOfRangeError, AppError)

    def test_all_errors_inherit_from_exception(self):
        assert issubclass(AppError, Exception)


class TestNotFoundError:
    def test_message(self):
        e = NotFoundError(resource="Device", identifier="abc-123")
        assert str(e) == "Device 'abc-123' not found"

    def test_attributes(self):
        e = NotFoundError(resource="User", identifier="42")
        assert e.resource == "User"
        assert e.identifier == "42"
        assert e.message == "User '42' not found"

    def test_is_catchable_as_app_error(self):
        with pytest.raises(AppError):
            raise NotFoundError(resource="Device", identifier="x")


class TestValidationError:
    def test_message(self):
        e = ValidationError(field="latitude", reason="must be in [-90, 90]")
        assert str(e) == "Invalid value for 'latitude': must be in [-90, 90]"

    def test_attributes(self):
        e = ValidationError(field="latitude", reason="must be in [-90, 90]")
        assert e.field == "latitude"
        assert e.reason == "must be in [-90, 90]"


class TestConflictError:
    def test_message(self):
        e = ConflictError(resource="Device", identifier="SEN-001")
        assert str(e) == "Device 'SEN-001' already exists"

    def test_attributes(self):
        e = ConflictError(resource="Device", identifier="SEN-001")
        assert e.resource == "Device"
        assert e.identifier == "SEN-001"


class TestUnauthorizedError:
    def test_message(self):
        e = UnauthorizedError(action="delete_device")
        assert str(e) == "Not authorized to perform 'delete_device'"

    def test_attributes(self):
        e = UnauthorizedError(action="delete_device")
        assert e.action == "delete_device"


class TestMeasurementOutOfRangeError:
    def test_message(self):
        e = MeasurementOutOfRangeError(unit="PM2.5", value=1500.0, min_value=0.0, max_value=1000.0)
        assert str(e) == "PM2.5 value 1500.0 out of range [0.0, 1000.0]"

    def test_attributes(self):
        e = MeasurementOutOfRangeError(unit="TEMP", value=99.0, min_value=-10.0, max_value=50.0)
        assert e.unit == "TEMP"
        assert e.value == 99.0
        assert e.min_value == -10.0
        assert e.max_value == 50.0

    def test_is_catchable_as_app_error(self):
        with pytest.raises(AppError):
            raise MeasurementOutOfRangeError(unit="CO2", value=50000.0, min_value=0.0, max_value=40000.0)
