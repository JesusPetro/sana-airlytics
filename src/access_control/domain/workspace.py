from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class Workspace:
    """
    Agrupacion logica de sensores.
    Exactamente uno de owner_user_id u owner_org_id debe ser no nulo.
    """

    id: UUID
    name: str
    owner_user_id: UUID | None
    owner_org_id: UUID | None
    is_private: bool

    def __post_init__(self) -> None:
        if self.owner_user_id is None and self.owner_org_id is None:
            raise ValueError("Workspace debe tener al menos un owner")
