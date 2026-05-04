from __future__ import annotations

from typing import Protocol
from uuid import UUID

from ..collaborator import Collaborator
from ..user import User
from ..workspace import Workspace


class UserRepository(Protocol):
    """Puerto de persistencia para usuarios."""

    async def save(self, user: User) -> None: ...
    async def find_by_id(self, user_id: UUID) -> User | None: ...
    async def find_by_email(self, email: str) -> User | None: ...


class WorkspaceRepository(Protocol):
    """Puerto de persistencia para workspaces."""

    async def save(self, workspace: Workspace) -> None: ...
    async def find_by_id(self, workspace_id: UUID) -> Workspace | None: ...
    async def find_by_owner_user(self, user_id: UUID) -> list[Workspace]: ...
    async def find_by_owner_org(self, org_id: UUID) -> list[Workspace]: ...
    async def soft_delete(self, workspace_id: UUID) -> None: ...


class CollaboratorRepository(Protocol):
    """Puerto de persistencia para colaboradores."""

    async def save(self, collaborator: Collaborator) -> None: ...
    async def find(self, user_id: UUID, workspace_id: UUID) -> Collaborator | None: ...
    async def find_by_workspace(self, workspace_id: UUID) -> list[Collaborator]: ...


class OrganizationRepository(Protocol):
    """Puerto de solo lectura para organizaciones. MVP: solo necesitamos el owner."""

    async def find_owner_user_id(self, org_id: UUID) -> UUID | None: ...


class AuditLogger(Protocol):
    """Puerto para registro de acciones criticas del sistema."""

    async def log(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str | None,
        success: bool,
        ip_address: str | None,
    ) -> None: ...
