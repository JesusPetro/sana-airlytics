from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

import bcrypt


class User:
    """
    Agregado raiz del BC access_control.
    Representa una cuenta registrada en la plataforma.
    """

    def __init__(
        self,
        id: UUID,
        email: str,
        password_hash: str,
        first_name: str,
        last_name: str,
        type: str | None = None,
        is_active: bool = True,
        deleted_at: datetime | None = None,
    ) -> None:
        if not email or "@" not in email:
            raise ValueError(f"Email invalido: {email!r}")
        self._id = id
        self._email = email.lower().strip()
        self._password_hash = password_hash
        self._first_name = first_name
        self._last_name = last_name
        self._type = type
        self._is_active = is_active
        self._deleted_at = deleted_at

    @classmethod
    def create(
        cls,
        id: UUID,
        email: str,
        plain_password: str,
        first_name: str,
        last_name: str,
        type: str | None = None,
    ) -> "User":
        """Factory que hashea la contrasena antes de construir el usuario."""
        password_hash = bcrypt.hashpw(
            plain_password.encode(), bcrypt.gensalt()
        ).decode()
        return cls(id, email, password_hash, first_name, last_name, type)

    def verify_password(self, plain_password: str) -> bool:
        """Verifica la contrasena en texto plano contra el hash almacenado."""
        return bcrypt.checkpw(
            plain_password.encode(), self._password_hash.encode()
        )

    def deactivate(self) -> None:
        """Desactiva la cuenta. El usuario no podra autenticarse."""
        self._is_active = False
        self._deleted_at = datetime.now(UTC)

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def email(self) -> str:
        return self._email

    @property
    def password_hash(self) -> str:
        return self._password_hash

    @property
    def first_name(self) -> str:
        return self._first_name

    @property
    def last_name(self) -> str:
        return self._last_name

    @property
    def type(self) -> str | None:
        """Campo informativo para la UI. No afecta la logica de acceso."""
        return self._type

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def deleted_at(self) -> datetime | None:
        return self._deleted_at

    @property
    def full_name(self) -> str:
        return f"{self._first_name} {self._last_name}"
