from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from ..domain.ports.repositories import AnnotationRepository
from .dtos import AnnotationDTO


class AnnotationNotFoundError(Exception): ...
class AnnotationNotOwnedError(Exception): ...


@dataclass(frozen=True)
class UpdateAnnotationInput:
    """Datos para editar el cuerpo de una anotacion."""
    annotation_id: str
    body: str
    requesting_user_id: str


class UpdateAnnotationUseCase:
    """Caso de uso: editar el cuerpo de una anotacion existente."""

    def __init__(self, repo: AnnotationRepository) -> None:
        self._repo = repo

    async def execute(self, cmd: UpdateAnnotationInput) -> AnnotationDTO:
        """Valida ownership y actualiza el cuerpo de la anotacion."""
        if cmd.body is None:
            raise ValueError("Al menos un campo debe ser provisto para actualizar el recurso.")
        annotation = await self._repo.find_by_id(UUID(cmd.annotation_id))
        if annotation is None:
            raise AnnotationNotFoundError(cmd.annotation_id)
        if annotation.created_by != UUID(cmd.requesting_user_id):
            raise AnnotationNotOwnedError(cmd.annotation_id)
        await self._repo.update_body(UUID(cmd.annotation_id), cmd.body)
        return AnnotationDTO(
            annotation_id=str(annotation.id),
            entity_type=annotation.entity_type,
            entity_id=str(annotation.entity_id),
            body=cmd.body,
            created_by=str(annotation.created_by),
            created_at=annotation.created_at,
        )
