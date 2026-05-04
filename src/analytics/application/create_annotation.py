from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid7

from ..domain.annotation import Annotation
from ..domain.ports.repositories import AnnotationRepository
from .dtos import AnnotationDTO, CreateAnnotationInput


class CreateAnnotationUseCase:
    """Caso de uso: crear una anotacion sobre una entidad del sistema."""

    def __init__(self, repo: AnnotationRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: CreateAnnotationInput) -> AnnotationDTO:
        """Persiste la anotacion y retorna su representacion."""
        annotation = Annotation(
            id=uuid7(),
            entity_type=cmd.entity_type,
            entity_id=UUID(cmd.entity_id),
            body=cmd.body,
            created_by=UUID(cmd.created_by),
            created_at=datetime.now(UTC),
        )
        await self._repo.save(annotation)
        return AnnotationDTO(
            annotation_id=str(annotation.id),
            entity_type=annotation.entity_type,
            entity_id=str(annotation.entity_id),
            body=annotation.body,
            created_by=str(annotation.created_by),
            created_at=annotation.created_at,
        )
