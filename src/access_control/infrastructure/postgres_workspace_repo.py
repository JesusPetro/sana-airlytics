from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.infrastructure.orm_models import WorkspaceModel

from ..domain.workspace import Workspace


class PostgresWorkspaceRepository:
    """Adaptador conducido: implementa WorkspaceRepository sobre PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, workspace: Workspace) -> None:
        """Inserta o actualiza el workspace en la BD."""
        model = WorkspaceModel(
            id=workspace.id,
            name=workspace.name,
            owner_user_id=workspace.owner_user_id,
            owner_org_id=workspace.owner_org_id,
            is_private=workspace.is_private,
        )
        await self._session.merge(model)
        await self._session.flush()

    async def find_by_id(self, workspace_id: UUID) -> Workspace | None:
        """Retorna el workspace por ID o None si no existe o fue eliminado."""
        model = await self._session.get(WorkspaceModel, workspace_id)
        if model is None or model.deleted_at is not None:
            return None
        return self._to_domain(model)

    async def find_by_owner_user(self, user_id: UUID) -> list[Workspace]:
        """Retorna todos los workspaces activos de un usuario."""
        stmt = select(WorkspaceModel).where(
            WorkspaceModel.owner_user_id == user_id,
            WorkspaceModel.deleted_at.is_(None),
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [self._to_domain(m) for m in rows]

    async def find_by_owner_org(self, org_id: UUID) -> list[Workspace]:
        """Retorna todos los workspaces activos de una organizacion."""
        stmt = select(WorkspaceModel).where(
            WorkspaceModel.owner_org_id == org_id,
            WorkspaceModel.deleted_at.is_(None),
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [self._to_domain(m) for m in rows]

    async def soft_delete(self, workspace_id: UUID) -> None:
        """
        Marca el workspace como eliminado registrando deleted_at.
        El workspace deja de aparecer en find_by_id y find_by_owner_user.
        """
        stmt = (
            update(WorkspaceModel)
            .where(WorkspaceModel.id == workspace_id)
            .values(deleted_at=datetime.now(UTC))
        )
        await self._session.execute(stmt)
        await self._session.flush()

    async def update(
        self,
        workspace_id: UUID,
        name: str | None,
        description: str | None,
        is_private: bool | None,
    ) -> None:
        """Actualiza solo los campos no None del workspace."""
        values: dict = {}
        if name is not None:
            values["name"] = name
        if description is not None:
            values["description"] = description
        if is_private is not None:
            values["is_private"] = is_private
        if not values:
            return
        stmt = update(WorkspaceModel).where(WorkspaceModel.id == workspace_id).values(**values)
        await self._session.execute(stmt)
        await self._session.flush()

    def _to_domain(self, model: WorkspaceModel) -> Workspace:
        """Convierte un modelo ORM a la entidad de dominio."""
        return Workspace(
            id=model.id,
            name=model.name,
            owner_user_id=model.owner_user_id,
            owner_org_id=model.owner_org_id,
            is_private=model.is_private,
        )
