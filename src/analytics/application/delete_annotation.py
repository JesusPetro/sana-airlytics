from __future__ import annotations

from uuid import UUID

from ..domain.ports.repositories import AnnotationRepository
from .update_annotation import AnnotationNotFoundError, AnnotationNotOwnedError


class DeleteAnnotationUseCase:
    """Caso de uso: eliminar una anotacion existente."""

    def __init__(self, repo: AnnotationRepository) -> None:
        self._repo = repo

    async def execute(self, annotation_id: str, requesting_user_id: str) -> None:
        """Valida ownership y elimina la anotacion."""
        annotation = await self._repo.find_by_id(UUID(annotation_id))
        if annotation is None:
            raise AnnotationNotFoundError(annotation_id)
        if annotation.created_by != UUID(requesting_user_id):
            raise AnnotationNotOwnedError(annotation_id)
        await self._repo.delete(UUID(annotation_id))
