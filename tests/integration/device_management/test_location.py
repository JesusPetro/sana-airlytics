import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from device_management.infrastructure.orm_models import (
    HistoricalLocationModel,
    LocationModel,
    SensorModel,
)


@pytest.fixture
async def sensor(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    await session.flush()

    s = SensorModel(
        code="SEN66-001", name="Sensor 1",
        model="SEN66+A7670SA", workspace_id=ws.id,
    )
    session.add(s)
    await session.flush()
    return s


async def test_create_location(session: AsyncSession, sensor):
    loc = LocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
    )
    session.add(loc)
    await session.flush()

    result = await session.get(LocationModel, loc.id)
    assert result.latitude == 4.7110
    assert result.longitude == -74.0721
    assert result.elevation is None


async def test_location_unique_per_sensor(session: AsyncSession, sensor):
    session.add(LocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
    ))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(LocationModel(
                sensor_id=sensor.id,
                latitude=6.2442,
                longitude=-75.5812,
            ))
            await session.flush()


async def test_create_historical_location(session: AsyncSession, sensor):
    hist = HistoricalLocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
        elevation=2600.0,
    )
    session.add(hist)
    await session.flush()

    result = await session.get(HistoricalLocationModel, hist.id)
    assert result.elevation == 2600.0


async def test_sensor_can_have_multiple_historical_locations(session: AsyncSession, sensor):
    session.add(HistoricalLocationModel(
        sensor_id=sensor.id, latitude=4.7110, longitude=-74.0721,
    ))
    session.add(HistoricalLocationModel(
        sensor_id=sensor.id, latitude=6.2442, longitude=-75.5812,
    ))
    await session.flush()

    results = (await session.execute(
        select(HistoricalLocationModel).where(HistoricalLocationModel.sensor_id == sensor.id)
    )).scalars().all()
    assert len(results) == 2
