from datetime import datetime, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import OrganizationModel, UserModel
from shared.infrastructure.orm_models import WorkspaceModel


@pytest.fixture
async def user(session: AsyncSession):
    u = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(u)
    await session.flush()
    return u


@pytest.fixture
async def org(session: AsyncSession, user):
    o = OrganizationModel(name="SANA", owner_user_id=user.id)
    session.add(o)
    await session.flush()
    return o


async def test_create_workspace_owned_by_user(session: AsyncSession, user):
    ws = WorkspaceModel(name="Workspace A", owner_user_id=user.id)
    session.add(ws)
    await session.flush()

    result = await session.get(WorkspaceModel, ws.id)
    assert result.name == "Workspace A"
    assert result.owner_user_id == user.id
    assert result.is_private is False


async def test_create_workspace_owned_by_org(session: AsyncSession, org):
    ws = WorkspaceModel(name="Workspace B", owner_org_id=org.id)
    session.add(ws)
    await session.flush()

    result = await session.get(WorkspaceModel, ws.id)
    assert result.owner_org_id == org.id


async def test_user_can_own_multiple_workspaces(session: AsyncSession, user):
    session.add(WorkspaceModel(name="WS 1", owner_user_id=user.id))
    session.add(WorkspaceModel(name="WS 2", owner_user_id=user.id))
    await session.flush()

    results = (await session.execute(
        select(WorkspaceModel).where(WorkspaceModel.owner_user_id == user.id)
    )).scalars().all()
    assert len(results) == 2


async def test_workspace_without_owner_fails(session: AsyncSession):
    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(WorkspaceModel(name="No owner"))
            await session.flush()


async def test_workspace_soft_delete(session: AsyncSession, user):
    ws = WorkspaceModel(name="To delete", owner_user_id=user.id)
    session.add(ws)
    await session.flush()

    ws.deleted_at = datetime.now(timezone.utc)
    await session.flush()

    result = await session.get(WorkspaceModel, ws.id)
    assert result.deleted_at is not None
