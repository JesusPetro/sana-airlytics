from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select, update
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

    async def find_by_id(self, annotation_id: UUID) -> Annotation | None:
        """Retorna la anotacion por ID o None."""
        model = await self._session.get(AnnotationModel, annotation_id)
        if model is None:
            return None
        return Annotation(
            id=model.id,
            entity_type=model.entity_type,
            entity_id=model.entity_id,
            body=model.body,
            created_by=model.created_by,
            created_at=model.created_at,
        )

    async def update_body(self, annotation_id: UUID, body: str) -> None:
        """Actualiza el cuerpo de la anotacion."""
        stmt = (
            update(AnnotationModel)
            .where(AnnotationModel.id == annotation_id)
            .values(body=body)
        )
        await self._session.execute(stmt)
        await self._session.flush()

    async def delete(self, annotation_id: UUID) -> None:
        """Elimina la anotacion por ID."""
        stmt = delete(AnnotationModel).where(AnnotationModel.id == annotation_id)
        await self._session.execute(stmt)
        await self._session.flush()
