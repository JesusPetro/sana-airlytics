from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid7

import pytest

from access_control.application.dtos import RegisterUserInput
from access_control.application.register_user import (
    EmailAlreadyRegisteredError,
    RegisterUserUseCase,
)
from access_control.domain.user import User
from access_control.infrastructure.no_op_audit_logger import NoOpAuditLogger


def _make_use_case(existing_user=None):
    user_repo = AsyncMock()
    user_repo.find_by_email.return_value = existing_user
    user_repo.save.return_value = None
    audit = NoOpAuditLogger()
    return RegisterUserUseCase(user_repo=user_repo, audit_logger=audit), user_repo


@pytest.mark.asyncio
async def test_registro_exitoso():
    """El flujo nominal debe crear y persistir el usuario."""
    use_case, user_repo = _make_use_case(existing_user=None)
    cmd = RegisterUserInput(
        email="nuevo@sana.com", password="pass123",
        first_name="Jesus", last_name="Petro",
    )
    result = await use_case.execute(cmd)
    assert result.user_id is not None
    user_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_email_duplicado_lanza_error():
    """Si el email ya existe debe lanzar EmailAlreadyRegisteredError."""
    usuario_existente = User.create(uuid7(), "dup@sana.com", "pass", "A", "B")
    use_case, user_repo = _make_use_case(existing_user=usuario_existente)
    cmd = RegisterUserInput(
        email="dup@sana.com", password="pass123",
        first_name="Otro", last_name="User",
    )
    with pytest.raises(EmailAlreadyRegisteredError):
        await use_case.execute(cmd)
    user_repo.save.assert_not_called()
