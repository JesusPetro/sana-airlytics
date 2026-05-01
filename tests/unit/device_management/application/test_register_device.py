from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.dtos import RegisterDeviceInput
from src.device_management.application.register_device import RegisterDeviceUseCase
from src.device_management.domain.device import Device
from src.device_management.domain.errors import DeviceAlreadyExistsError
from src.shared.domain.device_id import DeviceId


def _make_existing_device() -> Device:
    return Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
    )


def _input(**overrides) -> RegisterDeviceInput:
    defaults = dict(
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
    )
    defaults.update(overrides)
    return RegisterDeviceInput(**defaults)


def _make_use_case(existing_device=None) -> tuple[RegisterDeviceUseCase, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_code.return_value = existing_device
    return RegisterDeviceUseCase(repo), repo


# --- caso nominal ---

@pytest.mark.asyncio
async def test_returns_output_with_device_id_and_code():
    use_case, _ = _make_use_case()
    result = await use_case.execute(_input())
    assert result.code == "SANA-001"
    assert result.device_id is not None


@pytest.mark.asyncio
async def test_saves_device_to_repo():
    use_case, repo = _make_use_case()
    await use_case.execute(_input())
    repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_registered_device_has_no_workspace():
    use_case, repo = _make_use_case()
    await use_case.execute(_input())
    saved_device: Device = repo.save.call_args[0][0]
    assert saved_device.workspace_id is None


@pytest.mark.asyncio
async def test_site_type_passed_correctly():
    use_case, repo = _make_use_case()
    await use_case.execute(_input(site_type="OUTDOOR"))
    saved_device: Device = repo.save.call_args[0][0]
    from src.device_management.domain.site_type import SiteType
    assert saved_device.site_type == SiteType.OUTDOOR


@pytest.mark.asyncio
async def test_no_site_type_leaves_it_none():
    use_case, repo = _make_use_case()
    await use_case.execute(_input(site_type=None))
    saved_device: Device = repo.save.call_args[0][0]
    assert saved_device.site_type is None


# --- code duplicado ---

@pytest.mark.asyncio
async def test_duplicate_code_raises():
    use_case, _ = _make_use_case(existing_device=_make_existing_device())
    with pytest.raises(DeviceAlreadyExistsError):
        await use_case.execute(_input())


@pytest.mark.asyncio
async def test_duplicate_code_does_not_save():
    use_case, repo = _make_use_case(existing_device=_make_existing_device())
    with pytest.raises(DeviceAlreadyExistsError):
        await use_case.execute(_input())
    repo.save.assert_not_called()
