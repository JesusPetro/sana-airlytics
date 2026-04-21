from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.mark_device_offline import MarkDeviceOfflineUseCase
from src.device_management.domain.device import Device
from src.device_management.domain.device_status import DeviceStatus
from src.shared.domain.device_id import DeviceId


def _make_device() -> Device:
    device = Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
        workspace_id="ws-123",
    )
    device.pull_events()
    device.activate()
    device.pull_events()
    return device


def _make_use_case(device=None) -> tuple[MarkDeviceOfflineUseCase, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_id.return_value = device
    return MarkDeviceOfflineUseCase(repo), repo


@pytest.mark.asyncio
async def test_marks_device_inactive_and_saves():
    device = _make_device()
    use_case, repo = _make_use_case(device=device)
    await use_case.execute(str(device.id))
    assert device.status == DeviceStatus.INACTIVE
    repo.save.assert_called_once_with(device)


@pytest.mark.asyncio
async def test_device_not_found_is_silent():
    use_case, repo = _make_use_case(device=None)
    await use_case.execute(str(DeviceId.generate()))
    repo.save.assert_not_called()
