from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import RoleModel, UserModel


async def test_create_user(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hashed_password",
    )
    session.add(user)
    await session.flush()

    result = await session.get(UserModel, user.id)
    assert result.email == "jesus@sana.com"
    assert result.is_active is True


async def test_user_email_unique(session: AsyncSession):
    session.add(UserModel(
        first_name="Jesus", last_name="Petro",
        email="duplicate@sana.com", password_hash="hash",
    ))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(UserModel(
                first_name="Otro", last_name="User",
                email="duplicate@sana.com", password_hash="hash",
            ))
            await session.flush()


async def test_user_soft_delete(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="deleted@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    user.deleted_at = datetime.now(timezone.utc)
    await session.flush()

    result = await session.get(UserModel, user.id)
    assert result.deleted_at is not None


async def test_create_role(session: AsyncSession):
    role = RoleModel(name="admin", description="Full access")
    session.add(role)
    await session.flush()

    result = await session.get(RoleModel, role.id)
    assert result.name == "admin"


async def test_role_name_unique(session: AsyncSession):
    session.add(RoleModel(name="viewer"))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(RoleModel(name="viewer"))
            await session.flush()
