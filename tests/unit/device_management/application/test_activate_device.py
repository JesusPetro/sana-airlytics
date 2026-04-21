from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.activate_device import ActivateDeviceUseCase
from src.device_management.domain.device import Device
from src.device_management.domain.device_status import DeviceStatus
from src.device_management.domain.errors import DeviceNotFoundError
from src.shared.domain.device_id import DeviceId


def _make_device() -> Device:
    return Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
        workspace_id="ws-123",
    )


def _make_use_case(device=None) -> tuple[ActivateDeviceUseCase, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_id.return_value = device
    return ActivateDeviceUseCase(repo), repo


@pytest.mark.asyncio
async def test_activates_device_and_saves():
    device = _make_device()
    use_case, repo = _make_use_case(device=device)
    await use_case.execute(str(device.id))
    assert device.status == DeviceStatus.ACTIVE
    repo.save.assert_called_once_with(device)


@pytest.mark.asyncio
async def test_device_not_found_raises():
    use_case, _ = _make_use_case(device=None)
    with pytest.raises(DeviceNotFoundError):
        await use_case.execute(str(DeviceId.generate()))


@pytest.mark.asyncio
async def test_device_not_found_does_not_save():
    use_case, repo = _make_use_case(device=None)
    with pytest.raises(DeviceNotFoundError):
        await use_case.execute(str(DeviceId.generate()))
    repo.save.assert_not_called()
