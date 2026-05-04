from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.infrastructure.orm_models import AnnotationModel

from ..domain.annotation import Annotation


class PostgresAnnotationRepository:
    """Adaptador de persistencia y lectura para anotaciones."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, annotation: Annotation) -> None:
        """Inserta una nueva anotacion en la BD."""
        model = AnnotationModel(
            id=annotation.id,
            entity_type=annotation.entity_type,
            entity_id=annotation.entity_id,
            body=annotation.body,
            created_by=annotation.created_by,
        )
        self._session.add(model)
        await self._session.flush()

    async def find_by_entity(
        self,
        workspace_id: UUID,
        entity_type: str | None,
        entity_id: UUID | None,
    ) -> list[Annotation]:
        """
        Retorna anotaciones filtradas por entity_type y/o entity_id.
        workspace_id se valida en el router antes de llegar aqui.
        """
        stmt = select(AnnotationModel)
        if entity_type:
            stmt = stmt.where(AnnotationModel.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(AnnotationModel.entity_id == entity_id)
        stmt = stmt.order_by(AnnotationModel.created_at.desc())
        rows = (await self._session.execute(stmt)).scalars().all()
        return [
            Annotation(
                id=r.id,
                entity_type=r.entity_type,
                entity_id=r.entity_id,
                body=r.body,
                created_by=r.created_by,
                created_at=r.created_at,
            )
            for r in rows
        ]
