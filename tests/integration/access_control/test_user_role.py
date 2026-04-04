import pytest
from sqlalchemy.exc import IntegrityError

from access_control.infrastructure.orm_models import RoleModel, UserModel


def test_create_user(session):
    user = UserModel(
        first_name="Jesus",
        last_name="Petro",
        email="jesus@sana.com",
        password_hash="hashed_password",
    )
    session.add(user)
    session.flush()

    result = session.get(UserModel, user.id)
    assert result.email == "jesus@sana.com"
    assert result.is_active is True


def test_user_email_unique(session):
    session.add(
        UserModel(
            first_name="Jesus",
            last_name="Petro",
            email="duplicate@sana.com",
            password_hash="hash",
        )
    )
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(
                UserModel(
                    first_name="Otro",
                    last_name="User",
                    email="duplicate@sana.com",
                    password_hash="hash",
                )
            )
            session.flush()


def test_user_soft_delete(session):
    from datetime import datetime, timezone

    user = UserModel(
        first_name="Jesus",
        last_name="Petro",
        email="deleted@sana.com",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    user.deleted_at = datetime.now(timezone.utc)
    session.flush()

    result = session.get(UserModel, user.id)
    assert result.deleted_at is not None


def test_create_role(session):
    role = RoleModel(name="admin", description="Full access")
    session.add(role)
    session.flush()

    result = session.get(RoleModel, role.id)
    assert result.name == "admin"


def test_role_name_unique(session):
    session.add(RoleModel(name="viewer"))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(RoleModel(name="viewer"))
            session.flush()
