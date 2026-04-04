from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from analytics.infrastructure.orm_models import EventModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    ObservedPropertyModel,
    ProcessingLevelModel,
    UnitModel,
)
from device_management.infrastructure.orm_models import SensorModel


@pytest.fixture
def setup(session):
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
    level = ProcessingLevelModel(code="L0", definition="Raw data", order_index=0)
    session.add_all([prop, unit, level])
    session.flush()

    ds = DatastreamModel(
        name="PM2.5 Raw",
        sensor_id=sensor.id,
        observed_property_id=prop.id,
        unit_id=unit.id,
        processing_level_id=level.id,
    )
    session.add(ds)
    session.flush()

    return {"workspace": ws, "sensor": sensor, "datastream": ds}


def test_create_event(session, setup):
    event = EventModel(
        name="PM2.5 crítico",
        condition="result > 150",
        severity="critical",
        action="notify",
        workspace_id=setup["workspace"].id,
        sensor_id=setup["sensor"].id,
        datastream_id=setup["datastream"].id,
    )
    session.add(event)
    session.flush()

    result = session.get(EventModel, event.id)
    assert result.name == "PM2.5 crítico"
    assert result.is_active is True


def test_event_default_is_active(session, setup):
    event = EventModel(
        name="CO2 alto",
        condition="result > 1000",
        severity="warning",
        action="log",
        workspace_id=setup["workspace"].id,
        sensor_id=setup["sensor"].id,
        datastream_id=setup["datastream"].id,
    )
    session.add(event)
    session.flush()

    result = session.get(EventModel, event.id)
    assert result.is_active is True


def test_deactivate_event(session, setup):
    event = EventModel(
        name="VOC alto",
        condition="result > 200",
        severity="info",
        action="log",
        workspace_id=setup["workspace"].id,
        sensor_id=setup["sensor"].id,
        datastream_id=setup["datastream"].id,
    )
    session.add(event)
    session.flush()

    event.is_active = False
    session.flush()

    result = session.get(EventModel, event.id)
    assert result.is_active is False
