import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import CollaboratorModel, RoleModel, UserModel
from shared.infrastructure.orm_models import WorkspaceModel


@pytest.fixture
async def setup(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    ws = WorkspaceModel(name="Test Workspace", owner_user_id=user.id)
    session.add(ws)
    await session.flush()

    role = RoleModel(name="viewer")
    session.add(role)
    await session.flush()

    return {"user": user, "workspace": ws, "role": role}


async def test_create_collaborator(session: AsyncSession, setup):
    collab = CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    )
    session.add(collab)
    await session.flush()

    result = await session.get(CollaboratorModel, collab.id)
    assert result.is_active is True


async def test_collaborator_unique_per_workspace(session: AsyncSession, setup):
    session.add(CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    ))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(CollaboratorModel(
                user_id=setup["user"].id,
                workspace_id=setup["workspace"].id,
                role_id=setup["role"].id,
            ))
            await session.flush()


async def test_revoke_access(session: AsyncSession, setup):
    collab = CollaboratorModel(
        user_id=setup["user"].id,
        workspace_id=setup["workspace"].id,
        role_id=setup["role"].id,
    )
    session.add(collab)
    await session.flush()

    collab.is_active = False
    await session.flush()

    result = await session.get(CollaboratorModel, collab.id)
    assert result.is_active is False


async def test_user_can_collaborate_in_multiple_workspaces(session: AsyncSession, setup):
    ws2 = WorkspaceModel(name="Workspace 2", owner_user_id=setup["user"].id)
    session.add(ws2)
    await session.flush()

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
    await session.flush()

    results = (await session.execute(
        select(CollaboratorModel).where(CollaboratorModel.user_id == setup["user"].id)
    )).scalars().all()
    assert len(results) == 2
