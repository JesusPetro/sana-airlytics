from __future__ import annotations

from uuid import UUID, uuid7

from ..domain.collaborator import Collaborator
from ..domain.ports.repositories import (
    CollaboratorRepository,
    OrganizationRepository,
    UserRepository,
    WorkspaceRepository,
)
from .dtos import InviteCollaboratorInput


class InsufficientPrivilegesError(Exception):
    """El actor no tiene permisos suficientes para ejecutar esta accion."""


class CollaboratorAlreadyExistsError(Exception):
    """El usuario ya es colaborador activo en este workspace."""


class InviteCollaboratorUseCase:
    """Caso de uso: invitar a un usuario a un workspace con un rol asignado."""

    def __init__(
        self,
        user_repo: UserRepository,
        workspace_repo: WorkspaceRepository,
        collaborator_repo: CollaboratorRepository,
        org_repo: OrganizationRepository,
    ) -> None:
        self._users = user_repo
        self._workspaces = workspace_repo
        self._collaborators = collaborator_repo
        self._orgs = org_repo

    async def execute(self, cmd: InviteCollaboratorInput) -> None:
        """
        Verifica que el actor tiene permiso de invitacion (admin u owner)
        y crea el vinculo Collaborator para el invitado.
        """
        actor_id = UUID(cmd.actor_user_id)
        workspace_id = UUID(cmd.workspace_id)

        workspace = await self._workspaces.find_by_id(workspace_id)
        if workspace is None:
            raise ValueError(f"Workspace no encontrado: {cmd.workspace_id!r}")

        # Verificar si el actor es owner del workspace
        is_owner = workspace.owner_user_id == actor_id
        if not is_owner and workspace.owner_org_id is not None:
            org_owner = await self._orgs.find_owner_user_id(workspace.owner_org_id)
            is_owner = org_owner == actor_id

        if not is_owner:
            # Si no es owner, debe ser colaborador con rol admin
            actor_collab = await self._collaborators.find(actor_id, workspace_id)
            if actor_collab is None or actor_collab.role_name != "admin":
                raise InsufficientPrivilegesError(
                    "Solo admin u owner pueden invitar colaboradores"
                )

        # Buscar usuario invitado por email
        invitee = await self._users.find_by_email(cmd.invitee_email)
        if invitee is None:
            raise ValueError(f"Usuario no encontrado: {cmd.invitee_email!r}")

        # Buscar colaborador existente sin filtro de is_active
        existing = await self._collaborators.find_by_user_and_workspace(
            invitee.id, workspace_id
        )
        if existing is not None:
            if existing.is_active:
                raise CollaboratorAlreadyExistsError(
                    "El usuario ya es colaborador de este workspace"
                )
            await self._collaborators.reactivate(invitee.id, workspace_id, cmd.role_name)
            return

        collaborator = Collaborator(
            id=uuid7(),
            user_id=invitee.id,
            workspace_id=workspace_id,
            role_name=cmd.role_name,
            is_active=True,
        )
        await self._collaborators.save(collaborator)
