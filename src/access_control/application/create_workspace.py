from __future__ import annotations

from uuid import UUID, uuid7

from ..domain.ports.repositories import AuditLogger, UserRepository, WorkspaceRepository
from ..domain.workspace import Workspace
from .dtos import CreateWorkspaceInput, CreateWorkspaceOutput


class CreateWorkspaceUseCase:
    """Caso de uso: crear un workspace propiedad de un usuario."""

    def __init__(
        self,
        user_repo: UserRepository,
        workspace_repo: WorkspaceRepository,
        audit_logger: AuditLogger,
    ) -> None:
        self._users = user_repo
        self._workspaces = workspace_repo
        self._audit = audit_logger

    async def execute(self, cmd: CreateWorkspaceInput) -> CreateWorkspaceOutput:
        """Crea un workspace verificando que el usuario propietario existe y esta activo."""
        owner_id = UUID(cmd.owner_user_id)
        user = await self._users.find_by_id(owner_id)
        if user is None or not user.is_active:
            raise ValueError(f"Usuario no encontrado o inactivo: {cmd.owner_user_id!r}")

        workspace = Workspace(
            id=uuid7(),
            name=cmd.name,
            owner_user_id=owner_id,
            owner_org_id=None,
            is_private=cmd.is_private,
        )
        await self._workspaces.save(workspace)
        await self._audit.log(
            user_id=cmd.owner_user_id,
            action="WORKSPACE_CREATED",
            resource_type="workspace",
            resource_id=str(workspace.id),
            success=True,
            ip_address=None,
        )
        return CreateWorkspaceOutput(workspace_id=str(workspace.id))
