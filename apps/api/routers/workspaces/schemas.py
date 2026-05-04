from __future__ import annotations

from pydantic import BaseModel


class CreateWorkspaceRequest(BaseModel):
    """Datos para crear un workspace personal."""

    name: str
    description: str | None = None
    is_private: bool = False


class CreateWorkspaceResponse(BaseModel):
    """Identificador del workspace creado."""

    workspace_id: str


class WorkspaceSummary(BaseModel):
    """Resumen de un workspace para listados."""

    workspace_id: str
    name: str
    description: str | None
    is_private: bool
    owner_user_id: str | None
    owner_org_id: str | None


class InviteCollaboratorRequest(BaseModel):
    """Datos para invitar un colaborador a un workspace."""

    email: str
    role: str  # "admin" | "editor" | "viewer"


class ChangeCollaboratorRoleRequest(BaseModel):
    """Nuevo rol para un colaborador existente."""

    role: str  # "admin" | "editor" | "viewer"


class CollaboratorSummary(BaseModel):
    """Informacion de un colaborador en el workspace."""

    collaborator_id: str
    user_id: str
    workspace_id: str
    role: str
    is_active: bool
