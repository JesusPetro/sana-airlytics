from datetime import datetime, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel
from shared.infrastructure.orm_models import WorkspaceModel
from device_management.infrastructure.orm_models import SensorModel


@pytest.fixture
async def workspace(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    await session.flush()
    return ws


async def test_create_sensor(session: AsyncSession, workspace):
    sensor = SensorModel(
        code="SEN66-001", name="Sensor 1",
        model="SEN66+A7670SA", workspace_id=workspace.id,
    )
    session.add(sensor)
    await session.flush()

    result = await session.get(SensorModel, sensor.id)
    assert result.code == "SEN66-001"
    assert result.status == "PENDING"


async def test_sensor_code_unique(session: AsyncSession, workspace):
    session.add(SensorModel(
        code="SEN66-DUP", name="Sensor A",
        model="SEN66+A7670SA", workspace_id=workspace.id,
    ))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(SensorModel(
                code="SEN66-DUP", name="Sensor B",
                model="SEN66+A7670SA", workspace_id=workspace.id,
            ))
            await session.flush()


async def test_sensor_default_status(session: AsyncSession, workspace):
    sensor = SensorModel(
        code="SEN66-002", name="Sensor 2",
        model="SEN66+A7670SA", workspace_id=workspace.id,
    )
    session.add(sensor)
    await session.flush()

    result = await session.get(SensorModel, sensor.id)
    assert result.status == "PENDING"


async def test_sensor_soft_delete(session: AsyncSession, workspace):
    sensor = SensorModel(
        code="SEN66-DEL", name="Sensor to delete",
        model="SEN66+A7670SA", workspace_id=workspace.id,
    )
    session.add(sensor)
    await session.flush()

    sensor.deleted_at = datetime.now(timezone.utc)
    await session.flush()

    result = await session.get(SensorModel, sensor.id)
    assert result.deleted_at is not None
