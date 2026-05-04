from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class Annotation:
    """
    Nota textual vinculada a una entidad del sistema.
    entity_type indica el tipo: 'sensor', 'datastream' u 'observation'.
    """

    id: UUID
    entity_type: str
    entity_id: UUID
    body: str
    created_by: UUID
    created_at: datetime
