import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from device_management.infrastructure.orm_models import (
    HistoricalLocationModel,
    LocationModel,
    SensorModel,
)


@pytest.fixture
def sensor(session):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    session.flush()

    s = SensorModel(
        code="SEN66-001", name="Sensor 1",
        model="SEN66+A7670SA", workspace_id=ws.id,
    )
    session.add(s)
    session.flush()
    return s


def test_create_location(session, sensor):
    loc = LocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
    )
    session.add(loc)
    session.flush()

    result = session.get(LocationModel, loc.id)
    assert result.latitude == 4.7110
    assert result.longitude == -74.0721
    assert result.elevation is None


def test_location_unique_per_sensor(session, sensor):
    session.add(LocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
    ))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(LocationModel(
                sensor_id=sensor.id,
                latitude=6.2442,
                longitude=-75.5812,
            ))
            session.flush()


def test_create_historical_location(session, sensor):
    hist = HistoricalLocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
        elevation=2600.0,
    )
    session.add(hist)
    session.flush()

    result = session.get(HistoricalLocationModel, hist.id)
    assert result.elevation == 2600.0


def test_sensor_can_have_multiple_historical_locations(session, sensor):
    session.add(HistoricalLocationModel(
        sensor_id=sensor.id, latitude=4.7110, longitude=-74.0721,
    ))
    session.add(HistoricalLocationModel(
        sensor_id=sensor.id, latitude=6.2442, longitude=-75.5812,
    ))
    session.flush()

    from sqlalchemy import select
    results = session.execute(
        select(HistoricalLocationModel).where(
            HistoricalLocationModel.sensor_id == sensor.id
        )
    ).scalars().all()
    assert len(results) == 2
