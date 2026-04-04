import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import (
    CollaboratorModel,
    RoleModel,
    UserModel,
    WorkspaceModel,
)


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

    role = RoleModel(name="viewer")
    session.add(role)
    session.flush()

    return {"user": user, "workspace": ws, "role": role}


def test_create_collaborator(session, setup):
    collab = CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    )
    session.add(collab)
    session.flush()

    result = session.get(CollaboratorModel, collab.id)
    assert result.is_active is True


def test_collaborator_unique_per_workspace(session, setup):
    session.add(CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    ))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(CollaboratorModel(
                user_id=setup["user"].id,
                workspace_id=setup["workspace"].id,
                role_id=setup["role"].id,
            ))
            session.flush()


def test_revoke_access(session, setup):
    collab = CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    )
    session.add(collab)
    session.flush()

    collab.is_active = False
    session.flush()

    result = session.get(CollaboratorModel, collab.id)
    assert result.is_active is False


def test_user_can_collaborate_in_multiple_workspaces(session, setup):
    ws2 = WorkspaceModel(name="Workspace 2", owner_user_id=setup["user"].id)
    session.add(ws2)
    session.flush()

    session.add(CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    ))
    session.add(CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=ws2.id,
        role_id=setup["role"].id,
    ))
    session.flush()

    from sqlalchemy import select
    results = session.execute(
        select(CollaboratorModel).where(
            CollaboratorModel.user_id == setup["user"].id
        )
    ).scalars().all()
    assert len(results) == 2
