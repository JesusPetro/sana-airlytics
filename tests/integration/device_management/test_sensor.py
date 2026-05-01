import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from device_management.infrastructure.orm_models import SensorModel


@pytest.fixture
def workspace(session):
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
    return ws


def test_create_sensor(session, workspace):
    sensor = SensorModel(
        code="SEN66-001",
        name="Sensor 1",
        model="SEN66+A7670SA",
        workspace_id=workspace.id,
    )
    session.add(sensor)
    session.flush()

    result = session.get(SensorModel, sensor.id)
    assert result.code == "SEN66-001"
    assert result.status == "PENDING"


def test_sensor_code_unique(session, workspace):
    session.add(SensorModel(
        code="SEN66-DUP",
        name="Sensor A",
        model="SEN66+A7670SA",
        workspace_id=workspace.id,
    ))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(SensorModel(
                code="SEN66-DUP",
                name="Sensor B",
                model="SEN66+A7670SA",
                workspace_id=workspace.id,
            ))
            session.flush()


def test_sensor_default_status(session, workspace):
    sensor = SensorModel(
        code="SEN66-002",
        name="Sensor 2",
        model="SEN66+A7670SA",
        workspace_id=workspace.id,
    )
    session.add(sensor)
    session.flush()

    result = session.get(SensorModel, sensor.id)
    assert result.status == "PENDING"


def test_sensor_soft_delete(session, workspace):
    from datetime import datetime, timezone

    sensor = SensorModel(
        code="SEN66-DEL",
        name="Sensor to delete",
        model="SEN66+A7670SA",
        workspace_id=workspace.id,
    )
    session.add(sensor)
    session.flush()

    sensor.deleted_at = datetime.now(timezone.utc)
    session.flush()

    result = session.get(SensorModel, sensor.id)
    assert result.deleted_at is not None
