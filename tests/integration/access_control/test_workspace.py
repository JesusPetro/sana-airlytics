import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import OrganizationModel, UserModel, WorkspaceModel


@pytest.fixture
def user(session):
    u = UserModel(
        first_name="Jesus",
        last_name="Petro",
        email="jesus@sana.com",
        password_hash="hash",
    )
    session.add(u)
    session.flush()
    return u


@pytest.fixture
def org(session, user):
    o = OrganizationModel(name="SANA", owner_user_id=user.id)
    session.add(o)
    session.flush()
    return o


def test_create_workspace_owned_by_user(session, user):
    ws = WorkspaceModel(name="Workspace A", owner_user_id=user.id)
    session.add(ws)
    session.flush()

    result = session.get(WorkspaceModel, ws.id)
    assert result.name == "Workspace A"
    assert result.owner_user_id == user.id
    assert result.is_private is False


def test_create_workspace_owned_by_org(session, org):
    ws = WorkspaceModel(name="Workspace B", owner_org_id=org.id)
    session.add(ws)
    session.flush()

    result = session.get(WorkspaceModel, ws.id)
    assert result.owner_org_id == org.id


def test_user_can_own_multiple_workspaces(session, user):
    session.add(WorkspaceModel(name="WS 1", owner_user_id=user.id))
    session.add(WorkspaceModel(name="WS 2", owner_user_id=user.id))
    session.flush()

    from sqlalchemy import select
    results = session.execute(
        select(WorkspaceModel).where(WorkspaceModel.owner_user_id == user.id)
    ).scalars().all()
    assert len(results) == 2


def test_workspace_without_owner_fails(session):
    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(WorkspaceModel(name="No owner"))
            session.flush()


def test_workspace_soft_delete(session, user):
    from datetime import datetime, timezone

    ws = WorkspaceModel(name="To delete", owner_user_id=user.id)
    session.add(ws)
    session.flush()

    ws.deleted_at = datetime.now(timezone.utc)
    session.flush()

    result = session.get(WorkspaceModel, ws.id)
    assert result.deleted_at is not None
