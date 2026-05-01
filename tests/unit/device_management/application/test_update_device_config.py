from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.dtos import UpdateDeviceConfigInput
from src.device_management.application.update_device_config import UpdateDeviceConfigUseCase
from src.device_management.domain.device import Device
from src.device_management.domain.device_config import DeviceConfig
from src.device_management.domain.errors import DeviceNotFoundError
from src.shared.domain.device_id import DeviceId


def _make_device() -> Device:
    return Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
    )


def _make_use_case(device=None) -> tuple[UpdateDeviceConfigUseCase, AsyncMock, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_id.return_value = device
    publisher = AsyncMock()
    return UpdateDeviceConfigUseCase(repo, publisher), repo, publisher


def _input(device_id: str, sampling: int = 60, transmission: int = 300) -> UpdateDeviceConfigInput:
    return UpdateDeviceConfigInput(
        device_id=device_id,
        sampling_interval_seconds=sampling,
        transmission_interval_seconds=transmission,
    )


@pytest.mark.asyncio
async def test_updates_config_and_saves():
    device = _make_device()
    use_case, repo, _ = _make_use_case(device=device)
    await use_case.execute(_input(str(device.id), sampling=60, transmission=300))
    assert device.config.sampling_interval_seconds == 60
    assert device.config.transmission_interval_seconds == 300
    repo.save.assert_called_once_with(device)


@pytest.mark.asyncio
async def test_publishes_config_after_save():
    device = _make_device()
    use_case, repo, publisher = _make_use_case(device=device)
    await use_case.execute(_input(str(device.id), sampling=60, transmission=300))
    publisher.send_config_update.assert_called_once_with(
        device.id,
        DeviceConfig(sampling_interval_seconds=60, transmission_interval_seconds=300),
    )


@pytest.mark.asyncio
async def test_device_not_found_raises():
    use_case, _, __ = _make_use_case(device=None)
    with pytest.raises(DeviceNotFoundError):
        await use_case.execute(_input(str(DeviceId.generate())))


@pytest.mark.asyncio
async def test_invalid_config_raises_value_error():
    device = _make_device()
    use_case, repo, publisher = _make_use_case(device=device)
    with pytest.raises(ValueError):
        await use_case.execute(_input(str(device.id), sampling=5, transmission=300))
    repo.save.assert_not_called()
    publisher.send_config_update.assert_not_called()
