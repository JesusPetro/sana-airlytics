import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    DatastreamTagModel,
    ObservedPropertyModel,
    UnitModel,
)
from device_management.infrastructure.orm_models import SensorModel


@pytest.fixture
def datastream(session):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    session.flush()

    sensor = SensorModel(
        code="SEN66-001", name="Sensor 1",
        model="SEN66+A7670SA", workspace_id=ws.id,
    )
    session.add(sensor)
    session.flush()

    prop = ObservedPropertyModel(code="PM2_5", name="PM2.5")
    unit = UnitModel(code="UG_M3", name="Micrograms per cubic meter", symbol="µg/m³")
    session.add_all([prop, unit])
    session.flush()

    ds = DatastreamModel(
        name="PM2.5",
        sensor_id=sensor.id,
        observed_property_id=prop.id,
        unit_id=unit.id,
    )
    session.add(ds)
    session.flush()
    return ds


def test_create_tag(session, datastream):
    tag = DatastreamTagModel(
        datastream_id=datastream.id,
        key="zona",
        value="industrial",
    )
    session.add(tag)
    session.flush()

    result = session.get(DatastreamTagModel, tag.id)
    assert result.key == "zona"
    assert result.value == "industrial"


def test_duplicate_key_same_datastream_fails(session, datastream):
    session.add(DatastreamTagModel(
        datastream_id=datastream.id, key="zona", value="industrial",
    ))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(DatastreamTagModel(
                datastream_id=datastream.id, key="zona", value="urbana",
            ))
            session.flush()


def test_same_key_different_datastream(session, datastream):
    prop2 = ObservedPropertyModel(code="CO2", name="Carbon Dioxide")
    session.add(prop2)
    session.flush()

    unit = session.get(UnitModel, datastream.unit_id)

    ds2 = DatastreamModel(
        name="CO2",
        sensor_id=datastream.sensor_id,
        observed_property_id=prop2.id,
        unit_id=unit.id,
    )
    session.add(ds2)
    session.flush()

    session.add(DatastreamTagModel(datastream_id=datastream.id, key="zona", value="industrial"))
    session.add(DatastreamTagModel(datastream_id=ds2.id, key="zona", value="urbana"))
    session.flush()
