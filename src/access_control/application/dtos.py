from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RegisterUserInput:
    """Datos de entrada para registrar un nuevo usuario."""

    email: str
    password: str
    first_name: str
    last_name: str


@dataclass(frozen=True)
class RegisterUserOutput:
    """Datos de salida tras registrar un usuario."""

    user_id: str
    type: str | None    # campo informativo de users.type


@dataclass(frozen=True)
class LoginInput:
    """Credenciales para autenticacion."""

    email: str
    password: str


@dataclass(frozen=True)
class TokenOutput:
    """Tokens emitidos tras autenticacion exitosa."""

    access_token: str
    refresh_token: str
    user_id: str
    type: str | None


@dataclass(frozen=True)
class CreateWorkspaceInput:
    """Datos para crear un workspace personal."""

    owner_user_id: str
    name: str
    description: str | None = None
    is_private: bool = False


@dataclass(frozen=True)
class CreateWorkspaceOutput:
    """Identificador del workspace creado."""

    workspace_id: str


@dataclass(frozen=True)
class InviteCollaboratorInput:
    """Datos para invitar a un usuario a un workspace."""

    actor_user_id: str      # quien ejecuta la accion
    workspace_id: str
    invitee_email: str
    role_name: str          # "admin" | "editor" | "viewer"


@dataclass(frozen=True)
class UpdateWorkspaceInput:
    """Campos editables de un workspace. Solo owner o admin pueden modificarlos."""
    workspace_id: str
    name: str | None = None
    description: str | None = None
    is_private: bool | None = None


@dataclass(frozen=True)
class AuthorizeActionInput:
    """Consulta de autorizacion emitida por otro BC."""

    user_id: str
    action: str             # ej. "sensor:register", "observation:read"
    workspace_id: str
    ip_address: str | None = None


@dataclass(frozen=True)
class RequestPasswordResetInput:
    """Datos de entrada para solicitar un reset de contrasena."""

    email: str


@dataclass(frozen=True)
class RequestPasswordResetOutput:
    """
    Resultado de la solicitud de reset.
    Siempre exitoso para no revelar si el email existe.
    En development sin SMTP configurado, expone el token para testing.
    """

    message: str
    reset_token: str | None = None   # None en production y en dev con SMTP configurado
    dev_note: str | None = None


@dataclass(frozen=True)
class ResetPasswordInput:
    """Datos de entrada para confirmar el reset de contrasena."""

    token: str
    new_password: str


@dataclass(frozen=True)
class ResetPasswordOutput:
    """Resultado de confirmar el reset de contrasena."""

    message: str
