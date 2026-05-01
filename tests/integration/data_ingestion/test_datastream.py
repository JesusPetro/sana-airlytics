import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    ObservedPropertyModel,
    UnitModel,
)
from device_management.infrastructure.orm_models import SensorModel


@pytest.fixture
async def catalog(session: AsyncSession):
    prop = (await session.execute(select(ObservedPropertyModel).where(ObservedPropertyModel.code == "PM2_5"))).scalar_one()
    unit = (await session.execute(select(UnitModel).where(UnitModel.code == "UG_M3"))).scalar_one()
    return {"property": prop, "unit": unit}


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


async def test_create_datastream(session: AsyncSession, sensor, catalog):
    ds = DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=catalog["property"].id,
        unit_id=catalog["unit"].id,
    )
    session.add(ds)
    await session.flush()

    result = await session.get(DatastreamModel, ds.id)
    assert result.name == "PM2.5"
    assert result.observation_type == "Measurement"
    assert result.status == "active"


async def test_datastream_unique_constraint(session: AsyncSession, sensor, catalog):
    session.add(DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=catalog["property"].id,
        unit_id=catalog["unit"].id,
    ))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(DatastreamModel(
                name="PM2.5 Duplicate",
                sensor_id=sensor.id,
                observed_property_id=catalog["property"].id,
                unit_id=catalog["unit"].id,
            ))
            await session.flush()


async def test_datastream_same_sensor_different_property(session: AsyncSession, sensor, catalog):
    prop2 = (await session.execute(select(ObservedPropertyModel).where(ObservedPropertyModel.code == "CO2"))).scalar_one()

    session.add(DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=catalog["property"].id,
        unit_id=catalog["unit"].id,
    ))
    session.add(DatastreamModel(
        name="CO2",
        sensor_id=sensor.id,
        observed_property_id=prop2.id,
        unit_id=catalog["unit"].id,
    ))
    await session.flush()

    results = (await session.execute(
        select(DatastreamModel).where(DatastreamModel.sensor_id == sensor.id)
    )).scalars().all()
    assert len(results) == 2
