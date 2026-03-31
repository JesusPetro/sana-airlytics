import uuid

import pytest

from src.shared.domain.device_id import DeviceId


class TestDeviceIdValidation:
    def test_valid_uuid_accepted(self):
        valid = str(uuid.uuid4())
        device_id = DeviceId(valid)
        assert device_id.value == valid

    def test_invalid_format_raises(self):
        with pytest.raises(ValueError, match="Invalid DeviceId format"):
            DeviceId("not-a-uuid")

    def test_empty_string_raises(self):
        with pytest.raises(ValueError, match="Invalid DeviceId format"):
            DeviceId("")

    def test_partial_uuid_raises(self):
        with pytest.raises(ValueError, match="Invalid DeviceId format"):
            DeviceId("12345678-1234-1234")


class TestDeviceIdGenerate:
    def test_generate_returns_device_id(self):
        device_id = DeviceId.generate()
        assert isinstance(device_id, DeviceId)

    def test_generate_value_is_valid_uuid(self):
        device_id = DeviceId.generate()
        uuid.UUID(device_id.value)  # no lanza = válido

    def test_generate_produces_unique_ids(self):
        ids = {DeviceId.generate().value for _ in range(100)}
        assert len(ids) == 100


class TestDeviceIdEquality:
    def test_same_value_are_equal(self):
        val = str(uuid.uuid4())
        assert DeviceId(val) == DeviceId(val)

    def test_different_values_are_not_equal(self):
        assert DeviceId.generate() != DeviceId.generate()


class TestDeviceIdStr:
    def test_str_returns_value(self):
        val = str(uuid.uuid4())
        assert str(DeviceId(val)) == val

    def test_repr(self):
        val = str(uuid.uuid4())
        assert repr(DeviceId(val)) == f"DeviceId({val})"
