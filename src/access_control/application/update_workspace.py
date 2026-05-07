from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import WorkspaceRepository
from .dtos import UpdateWorkspaceInput


class WorkspaceNotFoundError(Exception): ...


class UpdateWorkspaceUseCase:
    """Caso de uso: editar metadatos de un workspace existente."""

    def __init__(self, repo: WorkspaceRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: UpdateWorkspaceInput) -> None:
        """Verifica que el workspace exista y actualiza los campos no None."""
        workspace = await self._repo.find_by_id(UUID(cmd.workspace_id))
        if workspace is None:
            raise WorkspaceNotFoundError(cmd.workspace_id)
        await self._repo.update(
            UUID(cmd.workspace_id),
            cmd.name,
            cmd.description,
            cmd.is_private,
        )
