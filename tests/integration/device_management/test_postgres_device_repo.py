from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from access_control.infrastructure.orm_models import UserModel, WorkspaceModel
from device_management.infrastructure.orm_models import LocationModel, SensorModel


@pytest.fixture
def workspace(session: Session):
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


@pytest.fixture
def sensor(session: Session, workspace):
    s = SensorModel(
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
        workspace_id=workspace.id,
        status="PENDING",
        sampling_interval_seconds=60,
        transmission_interval_seconds=300,
    )
    session.add(s)
    session.flush()
    return s


# --- save + find_by_id roundtrip ---

def test_sensor_persists_new_columns(session: Session, workspace):
    s = SensorModel(
        code="SANA-002",
        name="Sensor Techo",
        model="SEN66",
        workspace_id=workspace.id,
        status="PENDING",
        sampling_interval_seconds=120,
        transmission_interval_seconds=600,
    )
    session.add(s)
    session.flush()

    result = session.get(SensorModel, s.id)
    assert result.sampling_interval_seconds == 120
    assert result.transmission_interval_seconds == 600
    assert result.deactivated_at is None


def test_deactivated_at_persists(session: Session, sensor):
    now = datetime.now(UTC)
    sensor.deactivated_at = now
    session.flush()

    result = session.get(SensorModel, sensor.id)
    assert result.deactivated_at is not None


def test_default_sampling_and_transmission(session: Session, workspace):
    s = SensorModel(
        code="SANA-003",
        name="Sensor Default",
        model="SEN66",
        workspace_id=workspace.id,
    )
    session.add(s)
    session.flush()

    session.expire(s)
    result = session.get(SensorModel, s.id)
    assert result.sampling_interval_seconds == 60
    assert result.transmission_interval_seconds == 300


# --- find_by_code (uppercase) ---

def test_find_by_code_uppercase(session: Session, sensor):
    result = session.execute(
        select(SensorModel).where(SensorModel.code == "SANA-001")
    ).scalar_one_or_none()
    assert result is not None
    assert result.id == sensor.id


def test_find_by_code_lowercase_returns_nothing(session: Session, sensor):
    result = session.execute(
        select(SensorModel).where(SensorModel.code == "sana-001")
    ).scalar_one_or_none()
    assert result is None


# --- find_by_workspace excluye soft-deleted ---

def test_find_by_workspace_excludes_soft_deleted(session: Session, workspace):
    active = SensorModel(
        code="ACTIVE-001",
        name="Active",
        model="SEN66",
        workspace_id=workspace.id,
    )
    deleted = SensorModel(
        code="DELETED-001",
        name="Deleted",
        model="SEN66",
        workspace_id=workspace.id,
        deleted_at=datetime.now(UTC),
    )
    session.add_all([active, deleted])
    session.flush()

    results = session.execute(
        select(SensorModel).where(
            SensorModel.workspace_id == workspace.id,
            SensorModel.deleted_at.is_(None),
        )
    ).scalars().all()

    codes = {r.code for r in results}
    assert "ACTIVE-001" in codes
    assert "DELETED-001" not in codes


# --- location roundtrip ---

def test_location_persists_with_sensor(session: Session, sensor):
    loc = LocationModel(
        sensor_id=sensor.id,
        latitude=4.7110,
        longitude=-74.0721,
        elevation=2600.0,
    )
    session.add(loc)
    session.flush()

    result = session.execute(
        select(LocationModel).where(LocationModel.sensor_id == sensor.id)
    ).scalar_one_or_none()
    assert result is not None
    assert result.latitude == 4.7110
    assert result.elevation == 2600.0


def test_sensor_without_location_returns_none(session: Session, sensor):
    result = session.execute(
        select(LocationModel).where(LocationModel.sensor_id == sensor.id)
    ).scalar_one_or_none()
    assert result is None
