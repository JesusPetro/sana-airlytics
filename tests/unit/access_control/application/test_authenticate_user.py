from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid7

import pytest

from access_control.application.authenticate_user import (
    AuthenticationError,
    AuthenticateUserUseCase,
)
from access_control.application.dtos import LoginInput
from access_control.domain.user import User
from access_control.infrastructure.no_op_audit_logger import NoOpAuditLogger


def _make_use_case(user=None):
    user_repo = AsyncMock()
    user_repo.find_by_email.return_value = user
    token_service = MagicMock()
    token_service.generate_token.return_value = "access_token_fake"
    token_service.generate_refresh_token.return_value = "refresh_token_fake"
    audit = NoOpAuditLogger()
    return AuthenticateUserUseCase(
        user_repo=user_repo,
        token_service=token_service,
        audit_logger=audit,
    )


@pytest.mark.asyncio
async def test_login_exitoso():
    """Con credenciales correctas debe retornar TokenOutput."""
    user = User.create(uuid7(), "j@sana.com", "clave123", "Jesus", "Petro")
    use_case = _make_use_case(user=user)
    result = await use_case.execute(LoginInput(email="j@sana.com", password="clave123"))
    assert result.access_token == "access_token_fake"
    assert result.user_id == str(user.id)


@pytest.mark.asyncio
async def test_contrasena_incorrecta_lanza_error():
    """Con contrasena incorrecta debe lanzar AuthenticationError."""
    user = User.create(uuid7(), "j@sana.com", "clave123", "Jesus", "Petro")
    use_case = _make_use_case(user=user)
    with pytest.raises(AuthenticationError):
        await use_case.execute(LoginInput(email="j@sana.com", password="incorrecta"))


@pytest.mark.asyncio
async def test_email_inexistente_lanza_error():
    """Si el usuario no existe debe lanzar AuthenticationError."""
    use_case = _make_use_case(user=None)
    with pytest.raises(AuthenticationError):
        await use_case.execute(LoginInput(email="no@existe.com", password="pass"))


@pytest.mark.asyncio
async def test_usuario_inactivo_lanza_error():
    """Un usuario desactivado no puede autenticarse."""
    user = User.create(uuid7(), "j@sana.com", "clave123", "Jesus", "Petro")
    user.deactivate()
    use_case = _make_use_case(user=user)
    with pytest.raises(AuthenticationError):
        await use_case.execute(LoginInput(email="j@sana.com", password="clave123"))
