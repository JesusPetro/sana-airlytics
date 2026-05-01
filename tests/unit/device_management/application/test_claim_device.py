from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.claim_device import ClaimDeviceUseCase
from src.device_management.application.dtos import ClaimDeviceInput
from src.device_management.domain.device import Device
from src.device_management.domain.device_status import DeviceStatus
from src.device_management.domain.errors import DeviceAlreadyExistsError, DeviceNotFoundError
from src.shared.domain.device_id import DeviceId

_WS = "ws-123"


def _make_device(workspace_id: str | None = None) -> Device:
    device = Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
    )
    device.pull_events()
    if workspace_id is not None:
        device.claim(workspace_id)
        device.pull_events()
    return device


def _make_use_case(device=None) -> tuple[ClaimDeviceUseCase, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_code.return_value = device
    return ClaimDeviceUseCase(repo), repo


def _input(**overrides) -> ClaimDeviceInput:
    defaults = dict(code="SANA-001", workspace_id=_WS)
    defaults.update(overrides)
    return ClaimDeviceInput(**defaults)


@pytest.mark.asyncio
async def test_claims_device_and_saves():
    device = _make_device()
    use_case, repo = _make_use_case(device=device)
    await use_case.execute(_input())
    assert device.status == DeviceStatus.ACTIVE
    assert device.workspace_id == _WS
    repo.save.assert_called_once_with(device)


@pytest.mark.asyncio
async def test_device_not_found_raises():
    use_case, _ = _make_use_case(device=None)
    with pytest.raises(DeviceNotFoundError):
        await use_case.execute(_input())


@pytest.mark.asyncio
async def test_device_not_found_does_not_save():
    use_case, repo = _make_use_case(device=None)
    with pytest.raises(DeviceNotFoundError):
        await use_case.execute(_input())
    repo.save.assert_not_called()


@pytest.mark.asyncio
async def test_already_claimed_raises():
    device = _make_device(workspace_id="other-ws")
    use_case, _ = _make_use_case(device=device)
    with pytest.raises(DeviceAlreadyExistsError):
        await use_case.execute(_input())


@pytest.mark.asyncio
async def test_already_claimed_does_not_save():
    device = _make_device(workspace_id="other-ws")
    use_case, repo = _make_use_case(device=device)
    with pytest.raises(DeviceAlreadyExistsError):
        await use_case.execute(_input())
    repo.save.assert_not_called()
