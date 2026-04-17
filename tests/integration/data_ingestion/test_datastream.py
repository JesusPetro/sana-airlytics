import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    ObservedPropertyModel,
    UnitModel,
)
from device_management.infrastructure.orm_models import SensorModel


@pytest.fixture
def catalog(session):
    prop = ObservedPropertyModel(code="PM2_5", name="PM2.5")
    unit = UnitModel(code="UG_M3", name="Micrograms per cubic meter", symbol="µg/m³")
    session.add_all([prop, unit])
    session.flush()
    return {"property": prop, "unit": unit}


@pytest.fixture
def sensor(session):
    user = UserModel(
        first_name="Jesus",
        last_name="Petro",
        email="jesus@sana.com",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    session.flush()

    s = SensorModel(
        code="SEN66-001",
        name="Sensor 1",
        model="SEN66+A7670SA",
        workspace_id=ws.id,
    )
    session.add(s)
    session.flush()
    return s


def test_create_datastream(session, sensor, catalog):
    ds = DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=catalog["property"].id,
        unit_id=catalog["unit"].id,
    )
    session.add(ds)
    session.flush()

    result = session.get(DatastreamModel, ds.id)
    assert result.name == "PM2.5"
    assert result.observation_type == "Measurement"
    assert result.status == "active"


def test_datastream_unique_constraint(session, sensor, catalog):
    session.add(DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=catalog["property"].id,
        unit_id=catalog["unit"].id,
    ))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(DatastreamModel(
                name="PM2.5 Duplicate",
                sensor_id=sensor.id,
                observed_property_id=catalog["property"].id,
                unit_id=catalog["unit"].id,
            ))
            session.flush()


def test_datastream_same_sensor_different_property(session, sensor, catalog):
    prop2 = ObservedPropertyModel(code="CO2", name="Carbon Dioxide")
    session.add(prop2)
    session.flush()

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
    session.flush()

    from sqlalchemy import select
    results = session.execute(
        select(DatastreamModel).where(DatastreamModel.sensor_id == sensor.id)
    ).scalars().all()
    assert len(results) == 2
