from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from data_ingestion.infrastructure.orm_models import (
    DatastreamModel,
    ObservationModel,
    ObservationQualifierModel,
    ObservedPropertyModel,
    ProcessingLevelModel,
    ResultQualifierModel,
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
    return ds


def test_create_observation(session, datastream):
    now = datetime.now(timezone.utc)
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=now,
        result=12.5,
    )
    session.add(obs)
    session.flush()

    from sqlalchemy import select
    result = session.execute(
        select(ObservationModel).where(ObservationModel.id == obs.id)
    ).scalar_one()
    assert result.result == 12.5
    assert result.datastream_id == datastream.id


def test_observation_nullable_result(session, datastream):
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=datetime.now(timezone.utc),
        result=None,
    )
    session.add(obs)
    session.flush()

    from sqlalchemy import select
    result = session.execute(
        select(ObservationModel).where(ObservationModel.id == obs.id)
    ).scalar_one()
    assert result.result is None


def test_observation_qualifier(session, datastream):
    qualifier = ResultQualifierModel(code="LOW_BATTERY", description="Low battery")
    session.add(qualifier)
    session.flush()

    now = datetime.now(timezone.utc)
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=now,
        result=5.0,
    )
    session.add(obs)
    session.flush()

    oq = ObservationQualifierModel(
        observation_id=obs.id,
        phenomenon_time=now,
        qualifier_id=qualifier.id,
    )
    session.add(oq)
    session.flush()

    from sqlalchemy import select
    result = session.execute(
        select(ObservationQualifierModel).where(
            ObservationQualifierModel.observation_id == obs.id
        )
    ).scalar_one()
    assert result.qualifier_id == qualifier.id


def test_duplicate_pk_fails(session, datastream):
    now = datetime.now(timezone.utc)
    obs = ObservationModel(
        datastream_id=datastream.id,
        phenomenon_time=now,
        result=1.0,
    )
    session.add(obs)
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(ObservationModel(
                id=obs.id,
                datastream_id=datastream.id,
                phenomenon_time=now,
                result=2.0,
            ))
            session.flush()
