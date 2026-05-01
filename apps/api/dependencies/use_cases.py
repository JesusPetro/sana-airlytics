from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from src.access_control.application.authenticate_user import AuthenticateUserUseCase
from src.access_control.application.register_user import RegisterUserUseCase
from src.access_control.application.reset_password import ResetPasswordUseCase
from src.access_control.domain.ports.repositories import AuditLogger, UserRepository
from src.access_control.domain.ports.token_service import TokenService

from .audit_logger import get_audit_logger
from .auth import get_token_service
from .repositories import get_user_repository

_UserRepo = Annotated[UserRepository, Depends(get_user_repository)]
_AuditLog = Annotated[AuditLogger, Depends(get_audit_logger)]
_TokenSvc = Annotated[TokenService, Depends(get_token_service)]


def get_register_use_case(
    user_repo: _UserRepo,
    audit_logger: _AuditLog,
) -> RegisterUserUseCase:
    return RegisterUserUseCase(user_repo, audit_logger)


def get_authenticate_use_case(
    user_repo: _UserRepo,
    token_service: _TokenSvc,
    audit_logger: _AuditLog,
) -> AuthenticateUserUseCase:
    return AuthenticateUserUseCase(user_repo, token_service, audit_logger)


def get_reset_password_use_case(
    user_repo: _UserRepo,
    token_service: _TokenSvc,
) -> ResetPasswordUseCase:
    return ResetPasswordUseCase(user_repo, token_service)
