from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel
from shared.infrastructure.orm_models import WorkspaceModel
from device_management.domain.device import Device
from device_management.domain.device_config import DeviceConfig
from device_management.domain.device_location import DeviceLocation
from device_management.domain.device_status import DeviceStatus
from device_management.infrastructure.postgres_device_repo import PostgresDeviceRepository
from shared.domain.device_id import DeviceId


@pytest.fixture
async def workspace_id(session: AsyncSession) -> str:
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    await session.flush()
    return str(ws.id)


@pytest.fixture
def repo(session: AsyncSession) -> PostgresDeviceRepository:
    return PostgresDeviceRepository(session)


def _make_device(workspace_id: str, code: str = "SANA-001") -> Device:
    return Device.reconstitute(
        id=DeviceId.generate(),
        code=code,
        name="Sensor Patio",
        model="SEN66",
        workspace_id=workspace_id,
        status=DeviceStatus.PENDING,
        site_type=None,
        config=DeviceConfig(
            sampling_interval_seconds=60,
            transmission_interval_seconds=300,
        ),
        location=None,
        created_at=datetime.now(UTC),
        deactivated_at=None,
    )


async def test_save_and_find_by_id(repo: PostgresDeviceRepository, workspace_id: str):
    device = _make_device(workspace_id)
    await repo.save(device)

    result = await repo.find_by_id(DeviceId(device.id.value))
    assert result is not None
    assert result.id.value == device.id.value
    assert result.code == "SANA-001"
    assert result.status == DeviceStatus.PENDING


async def test_find_by_id_returns_none_when_missing(repo: PostgresDeviceRepository):
    result = await repo.find_by_id(DeviceId.generate())
    assert result is None


async def test_save_and_find_by_code(repo: PostgresDeviceRepository, workspace_id: str):
    device = _make_device(workspace_id, code="SANA-002")
    await repo.save(device)

    result = await repo.find_by_code("SANA-002")
    assert result is not None
    assert result.id.value == device.id.value


async def test_find_by_code_case_insensitive(repo: PostgresDeviceRepository, workspace_id: str):
    device = _make_device(workspace_id, code="SANA-003")
    await repo.save(device)

    result = await repo.find_by_code("sana-003")
    assert result is not None
    assert result.id.value == device.id.value


async def test_find_by_code_returns_none_when_missing(repo: PostgresDeviceRepository):
    result = await repo.find_by_code("NONEXISTENT")
    assert result is None


async def test_save_upserts_existing_device(repo: PostgresDeviceRepository, workspace_id: str):
    device = _make_device(workspace_id)
    await repo.save(device)

    updated = Device.reconstitute(
        id=device.id,
        code=device.code,
        name="Sensor Techo",
        model=device.model,
        workspace_id=workspace_id,
        status=DeviceStatus.ACTIVE,
        site_type=None,
        config=device.config,
        location=None,
        created_at=device.created_at,
        deactivated_at=None,
    )
    await repo.save(updated)

    result = await repo.find_by_id(device.id)
    assert result.name == "Sensor Techo"
    assert result.status == DeviceStatus.ACTIVE


async def test_save_with_location(repo: PostgresDeviceRepository, workspace_id: str):
    device = Device.reconstitute(
        id=DeviceId.generate(),
        code="SANA-LOC",
        name="Sensor con ubicación",
        model="SEN66",
        workspace_id=workspace_id,
        status=DeviceStatus.PENDING,
        site_type=None,
        config=DeviceConfig(
            sampling_interval_seconds=60,
            transmission_interval_seconds=300,
        ),
        location=DeviceLocation(latitude=4.7110, longitude=-74.0721, elevation=2600.0),
        created_at=datetime.now(UTC),
        deactivated_at=None,
    )
    await repo.save(device)

    result = await repo.find_by_id(device.id)
    assert result.location is not None
    assert result.location.latitude == 4.7110
    assert result.location.elevation == 2600.0


async def test_find_by_workspace_excludes_deleted(repo: PostgresDeviceRepository, session: AsyncSession, workspace_id: str):
    from device_management.infrastructure.orm_models import SensorModel
    active = _make_device(workspace_id, code="ACTIVE-001")
    await repo.save(active)

    # soft-delete directo en el ORM, el dominio no expone deleted_at
    from uuid import UUID
    deleted_sensor = SensorModel(
        id=UUID(DeviceId.generate().value),
        code="DELETED-001",
        name="Deleted",
        model="SEN66",
        workspace_id=UUID(workspace_id),
        deleted_at=datetime.now(UTC),
    )
    session.add(deleted_sensor)
    await session.flush()

    results = await repo.find_by_workspace(workspace_id)
    codes = {d.code for d in results}
    assert "ACTIVE-001" in codes
    assert "DELETED-001" not in codes


async def test_find_by_workspace_returns_all_active(repo: PostgresDeviceRepository, workspace_id: str):
    await repo.save(_make_device(workspace_id, code="DEV-A"))
    await repo.save(_make_device(workspace_id, code="DEV-B"))

    results = await repo.find_by_workspace(workspace_id)
    codes = {d.code for d in results}
    assert "DEV-A" in codes
    assert "DEV-B" in codes
