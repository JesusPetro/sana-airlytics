from __future__ import annotations

from shared.infrastructure.logger import get_logger
from uuid import uuid7

from ..domain.ports.repositories import AuditLogger, UserRepository
from ..domain.user import PasswordTooWeakError as _DomainWeakPassword, User
from .dtos import RegisterUserInput, RegisterUserOutput
from .errors import WeakPasswordError
from src.shared.email.email_service import EmailService

logger = get_logger(__name__)


class EmailAlreadyRegisteredError(Exception):
    """El email ya esta registrado en la plataforma."""


class RegisterUserUseCase:
    """Caso de uso: registrar un nuevo usuario individual."""

    def __init__(
        self,
        user_repo: UserRepository,
        audit_logger: AuditLogger,
        email_service: EmailService | None = None,
    ) -> None:
        self._users = user_repo
        self._audit = audit_logger
        self._email = email_service

    async def execute(self, cmd: RegisterUserInput) -> RegisterUserOutput:
        """
        Registra un nuevo usuario verificando unicidad del email.
        Hashea la contrasena antes de persistir.
        """
        existing = await self._users.find_by_email(cmd.email)
        if existing is not None:
            raise EmailAlreadyRegisteredError(
                f"El email {cmd.email!r} ya esta registrado"
            )

        try:
            user = User.create(
                id=uuid7(),
                email=cmd.email,
                plain_password=cmd.password,
                first_name=cmd.first_name,
                last_name=cmd.last_name,
                middle_name=cmd.middle_name,
                phone=cmd.phone,
                address=cmd.address,
                type=cmd.type,
            )
        except _DomainWeakPassword as e:
            raise WeakPasswordError(str(e)) from e
        await self._users.save(user)
        await self._audit.log(
            user_id=str(user.id),
            action="REGISTER",
            resource_type="user",
            resource_id=str(user.id),
            success=True,
            ip_address=None,
        )
        if self._email is not None:
            try:
                await self._email.send_account_created_email(
                    to_email=user.email,
                    name=user.first_name,
                )
            except Exception:
                logger.warning(
                    "email_account_created_failed: user_id=%s email=%s",
                    str(user.id),
                    user.email,
                )
        return RegisterUserOutput(user_id=str(user.id), type=user.type)
