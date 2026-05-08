from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.collaborator import Collaborator
from .orm_models import CollaboratorModel, RoleModel


class PostgresCollaboratorRepository:
    """
    Adaptador conducido: implementa CollaboratorRepository sobre PostgreSQL.
    Patron clave: hace JOIN con roles para resolver role_name al leer,
    y consulta roles por nombre para obtener role_id al escribir.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find(self, user_id: UUID, workspace_id: UUID) -> Collaborator | None:
        """Retorna el colaborador activo o None si no existe o esta revocado."""
        stmt = (
            select(CollaboratorModel, RoleModel.name)
            .join(RoleModel, CollaboratorModel.role_id == RoleModel.id)
            .where(
                CollaboratorModel.user_id == user_id,
                CollaboratorModel.workspace_id == workspace_id,
                CollaboratorModel.is_active.is_(True),
            )
        )
        row = (await self._session.execute(stmt)).one_or_none()
        if row is None:
            return None
        model, role_name = row
        return self._to_domain(model, role_name)

    async def save(self, collaborator: Collaborator) -> None:
        """Persiste el colaborador resolviendo el role_id desde roles.name."""
        role_stmt = select(RoleModel.id).where(RoleModel.name == collaborator.role_name)
        role_id = (await self._session.execute(role_stmt)).scalar_one_or_none()
        if role_id is None:
            raise ValueError(
                f"Rol no encontrado en BD: {collaborator.role_name!r}. "
                f"Verificar que la tabla roles contiene admin/editor/viewer."
            )
        model = CollaboratorModel(
            id=collaborator.id,
            user_id=collaborator.user_id,
            workspace_id=collaborator.workspace_id,
            role_id=role_id,
            is_active=collaborator.is_active,
        )
        await self._session.merge(model)
        await self._session.flush()

    async def find_by_workspace(self, workspace_id: UUID) -> list[Collaborator]:
        """Retorna todos los colaboradores activos de un workspace."""
        stmt = (
            select(CollaboratorModel, RoleModel.name)
            .join(RoleModel, CollaboratorModel.role_id == RoleModel.id)
            .where(
                CollaboratorModel.workspace_id == workspace_id,
                CollaboratorModel.is_active.is_(True),
            )
        )
        rows = (await self._session.execute(stmt)).all()
        return [self._to_domain(m, name) for m, name in rows]

    async def find_by_user_and_workspace(
        self, user_id: UUID, workspace_id: UUID
    ) -> Collaborator | None:
        """Retorna el colaborador (activo o inactivo) o None si nunca existio."""
        stmt = (
            select(CollaboratorModel, RoleModel.name)
            .join(RoleModel, CollaboratorModel.role_id == RoleModel.id)
            .where(
                CollaboratorModel.user_id == user_id,
                CollaboratorModel.workspace_id == workspace_id,
            )
        )
        row = (await self._session.execute(stmt)).one_or_none()
        if row is None:
            return None
        model, role_name = row
        return self._to_domain(model, role_name)

    async def reactivate(
        self, user_id: UUID, workspace_id: UUID, role_name: str
    ) -> None:
        """Reactiva un colaborador previo y le asigna un nuevo rol."""
        role_stmt = select(RoleModel.id).where(RoleModel.name == role_name)
        role_id = (await self._session.execute(role_stmt)).scalar_one_or_none()
        if role_id is None:
            raise ValueError(
                f"Rol no encontrado en BD: {role_name!r}. "
                f"Verificar que la tabla roles contiene admin/editor/viewer."
            )
        stmt = (
            update(CollaboratorModel)
            .where(
                CollaboratorModel.user_id == user_id,
                CollaboratorModel.workspace_id == workspace_id,
            )
            .values(is_active=True, role_id=role_id)
        )
        await self._session.execute(stmt)
        await self._session.flush()

    def _to_domain(self, model: CollaboratorModel, role_name: str) -> Collaborator:
        """Convierte un modelo ORM a la entidad de dominio."""
        return Collaborator(
            id=model.id,
            user_id=model.user_id,
            workspace_id=model.workspace_id,
            role_name=role_name,
            is_active=model.is_active,
        )
