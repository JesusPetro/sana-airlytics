from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel
from shared.infrastructure.orm_models import WorkspaceModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    ObservedPropertyModel,
    UnitModel,
)
from device_management.infrastructure.orm_models import SensorModel
from shared.infrastructure.orm_models import ObservationModel


@pytest.fixture
async def datastream(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    await session.flush()

    sensor = SensorModel(
        code="SEN66-001", name="Sensor 1",
        model="SEN66+A7670SA", workspace_id=ws.id,
    )
    session.add(sensor)
    await session.flush()

    prop = (await session.execute(select(ObservedPropertyModel).where(ObservedPropertyModel.code == "PM2_5"))).scalar_one()
    unit = (await session.execute(select(UnitModel).where(UnitModel.code == "UG_M3"))).scalar_one()

    ds = DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=prop.id,
        unit_id=unit.id,
    )
    session.add(ds)
    await session.flush()
    return ds


async def test_create_observation(session: AsyncSession, datastream):
    now = datetime.now(UTC)
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=now,
        result=12.5,
    )
    session.add(obs)
    await session.flush()

    result = (await session.execute(
        select(ObservationModel).where(ObservationModel.id == obs.id)
    )).scalar_one()
    assert result.result == 12.5
    assert result.datastream_id == datastream.id


async def test_observation_nullable_result(session: AsyncSession, datastream):
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=datetime.now(UTC),
        result=None,
    )
    session.add(obs)
    await session.flush()

    result = (await session.execute(
        select(ObservationModel).where(ObservationModel.id == obs.id)
    )).scalar_one()
    assert result.result is None


async def test_observation_with_qualifier(session: AsyncSession, datastream):
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=datetime.now(UTC),
        result=5.0,
        qualifier="SUSPICIOUS_VALUE",
    )
    session.add(obs)
    await session.flush()

    result = (await session.execute(
        select(ObservationModel).where(ObservationModel.id == obs.id)
    )).scalar_one()
    assert result.qualifier == "SUSPICIOUS_VALUE"


async def test_duplicate_pk_fails(session: AsyncSession, datastream):
    now = datetime.now(UTC)
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=now,
        result=1.0,
    )
    session.add(obs)
    await session.flush()

    session.expunge(obs)
    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(ObservationModel(
                id=obs.id,
                datastream_id=datastream.id,
                phenomenon_time=now,
                result=2.0,
            ))
            await session.flush()
