from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import AnnotationRepository
from .dtos import AnnotationDTO


class GetAnnotationsUseCase:
    """Caso de uso: listar anotaciones de un workspace filtradas por entidad."""

    def __init__(self, repo: AnnotationRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        workspace_id: str,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> list[AnnotationDTO]:
        """Retorna anotaciones filtradas. Si no hay filtros, retorna todas las del workspace."""
        rows = await self._repo.find_by_entity(
            workspace_id=UUID(workspace_id),
            entity_type=entity_type,
            entity_id=UUID(entity_id) if entity_id else None,
        )
        return [
            AnnotationDTO(
                annotation_id=str(r.id),
                entity_type=r.entity_type,
                entity_id=str(r.entity_id),
                body=r.body,
                created_by=str(r.created_by),
                created_at=r.created_at,
            )
            for r in rows
        ]
