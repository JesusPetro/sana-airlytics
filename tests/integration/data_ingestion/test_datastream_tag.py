import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    DatastreamTagModel,
    ObservedPropertyModel,
    UnitModel,
)
from device_management.infrastructure.orm_models import SensorModel


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


async def test_create_tag(session: AsyncSession, datastream):
    tag = DatastreamTagModel(
        datastream_id=datastream.id,
        key="zona",
        value="industrial",
    )
    session.add(tag)
    await session.flush()

    result = await session.get(DatastreamTagModel, tag.id)
    assert result.key == "zona"
    assert result.value == "industrial"


async def test_duplicate_key_same_datastream_fails(session: AsyncSession, datastream):
    session.add(DatastreamTagModel(
        datastream_id=datastream.id, key="zona", value="industrial",
    ))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(DatastreamTagModel(
                datastream_id=datastream.id, key="zona", value="urbana",
            ))
            await session.flush()


async def test_same_key_different_datastream(session: AsyncSession, datastream):
    prop2 = (await session.execute(select(ObservedPropertyModel).where(ObservedPropertyModel.code == "CO2"))).scalar_one()
    unit = await session.get(UnitModel, datastream.unit_id)

    ds2 = DatastreamModel(
        name="CO2",
        sensor_id=datastream.sensor_id,
        observed_property_id=prop2.id,
        unit_id=unit.id,
    )
    session.add(ds2)
    await session.flush()

    session.add(DatastreamTagModel(datastream_id=datastream.id, key="zona", value="industrial"))
    session.add(DatastreamTagModel(datastream_id=ds2.id, key="zona", value="urbana"))
    await session.flush()
