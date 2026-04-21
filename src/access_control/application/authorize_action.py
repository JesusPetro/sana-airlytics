from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import (
    AuditLogger,
    CollaboratorRepository,
    OrganizationRepository,
    WorkspaceRepository,
)
from ..domain.rbac_evaluator import AuthorizationResult, RbacEvaluator
from .dtos import AuthorizeActionInput


class AuthorizeActionUseCase:
    """
    Caso de uso: evaluar si un usuario puede ejecutar una accion en un workspace.
    Usado por otros BCs antes de ejecutar operaciones sensibles.
    """

    def __init__(
        self,
        workspace_repo: WorkspaceRepository,
        collaborator_repo: CollaboratorRepository,
        org_repo: OrganizationRepository,
        audit_logger: AuditLogger,
        evaluator: RbacEvaluator,
    ) -> None:
        self._workspaces = workspace_repo
        self._collaborators = collaborator_repo
        self._orgs = org_repo
        self._audit = audit_logger
        self._evaluator = evaluator

    async def execute(self, cmd: AuthorizeActionInput) -> AuthorizationResult:
        """
        Resuelve el rol efectivo del usuario en el workspace y evalua la accion.
        El owner tiene acceso implicito sin necesitar un registro Collaborator.
        """
        user_id = UUID(cmd.user_id)
        workspace_id = UUID(cmd.workspace_id)

        workspace = await self._workspaces.find_by_id(workspace_id)
        if workspace is None:
            return AuthorizationResult(allowed=False, reason="Workspace no encontrado")

        # Verificar si es owner directo del workspace
        is_owner = workspace.owner_user_id == user_id

        # Verificar si es owner de la organizacion duena del workspace
        if not is_owner and workspace.owner_org_id is not None:
            org_owner = await self._orgs.find_owner_user_id(workspace.owner_org_id)
            is_owner = org_owner == user_id

        # Si es owner, acceso implicito sin consultar collaborators
        if is_owner:
            return self._evaluator.evaluate(cmd.action, role_name=None, is_owner=True)

        # Resolver rol via collaborator
        collaborator = await self._collaborators.find(user_id, workspace_id)
        role_name = collaborator.role_name if collaborator else None

        result = self._evaluator.evaluate(cmd.action, role_name=role_name, is_owner=False)

        # Registrar denegaciones para auditoria
        if not result.allowed:
            await self._audit.log(
                user_id=cmd.user_id,
                action="ACCESS_DENIED",
                resource_type="workspace",
                resource_id=cmd.workspace_id,
                success=False,
                ip_address=cmd.ip_address,
            )

        return result
