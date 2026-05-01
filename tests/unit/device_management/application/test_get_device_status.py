from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.device_management.application.get_device_status import GetDeviceStatusUseCase
from src.device_management.domain.device import Device
from src.device_management.domain.device_location import DeviceLocation
from src.device_management.domain.errors import DeviceNotFoundError
from src.device_management.domain.site_type import SiteType
from src.shared.domain.device_id import DeviceId


def _make_device(site_type=None, location=None) -> Device:
    device = Device(
        id=DeviceId.generate(),
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
        site_type=site_type,
        location=location,
    )
    device.pull_events()
    return device


def _make_use_case(device=None) -> tuple[GetDeviceStatusUseCase, AsyncMock]:
    repo = AsyncMock()
    repo.find_by_id.return_value = device
    return GetDeviceStatusUseCase(repo), repo


@pytest.mark.asyncio
async def test_returns_status_output():
    device = _make_device()
    use_case, _ = _make_use_case(device=device)
    result = await use_case.execute(str(device.id))
    assert result.code == "SANA-001"
    assert result.model == "SEN66"
    assert result.status == "PENDING"


@pytest.mark.asyncio
async def test_site_type_mapped_to_string():
    device = _make_device(site_type=SiteType.OUTDOOR)
    use_case, _ = _make_use_case(device=device)
    result = await use_case.execute(str(device.id))
    assert result.site_type == "OUTDOOR"


@pytest.mark.asyncio
async def test_no_site_type_is_none():
    device = _make_device()
    use_case, _ = _make_use_case(device=device)
    result = await use_case.execute(str(device.id))
    assert result.site_type is None


@pytest.mark.asyncio
async def test_location_fields_mapped_when_present():
    location = DeviceLocation(latitude=10.39, longitude=-75.47, elevation=12.0)
    device = _make_device(location=location)
    use_case, _ = _make_use_case(device=device)
    result = await use_case.execute(str(device.id))
    assert result.latitude == 10.39
    assert result.longitude == -75.47
    assert result.elevation == 12.0


@pytest.mark.asyncio
async def test_location_fields_none_when_absent():
    device = _make_device()
    use_case, _ = _make_use_case(device=device)
    result = await use_case.execute(str(device.id))
    assert result.latitude is None
    assert result.longitude is None
    assert result.elevation is None


@pytest.mark.asyncio
async def test_device_not_found_raises():
    use_case, _ = _make_use_case(device=None)
    with pytest.raises(DeviceNotFoundError):
        await use_case.execute(str(DeviceId.generate()))
