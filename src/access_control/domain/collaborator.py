from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class Collaborator:
    """
    Vinculo entre un usuario y un workspace con un rol asignado.
    El dominio trabaja con role_name (str). El repositorio resuelve el role_id al persistir.
    """

    id: UUID
    user_id: UUID
    workspace_id: UUID
    role_name: str      # "admin" | "editor" | "viewer"
    is_active: bool
