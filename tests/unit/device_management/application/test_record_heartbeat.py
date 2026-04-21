from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.record_heartbeat import RecordHeartbeatUseCase
from src.device_management.domain.device import Device
from src.device_management.domain.device_status import DeviceStatus
from src.shared.domain.device_id import DeviceId


def _make_device(active: bool = True) -> Device:
    device = Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
        workspace_id="ws-123",
    )
    device.pull_events()
    if active:
        device.activate()
        device.pull_events()
    return device


def _make_use_case(device=None) -> tuple[RecordHeartbeatUseCase, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_id.return_value = device
    return RecordHeartbeatUseCase(repo), repo


@pytest.mark.asyncio
async def test_records_heartbeat_and_saves():
    device = _make_device()
    use_case, repo = _make_use_case(device=device)
    await use_case.execute(str(device.id))
    assert device.last_seen is not None
    repo.save.assert_called_once_with(device)


@pytest.mark.asyncio
async def test_reactivates_inactive_device():
    device = _make_device(active=True)
    device.mark_offline()
    device.pull_events()
    assert device.status == DeviceStatus.INACTIVE

    use_case, _ = _make_use_case(device=device)
    await use_case.execute(str(device.id))
    assert device.status == DeviceStatus.ACTIVE


@pytest.mark.asyncio
async def test_device_not_found_is_silent():
    use_case, repo = _make_use_case(device=None)
    await use_case.execute(str(DeviceId.generate()))
    repo.save.assert_not_called()
