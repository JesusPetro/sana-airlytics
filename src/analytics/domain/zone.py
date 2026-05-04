from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class Zone:
    """
    Area geografica circular definida por un centro y un radio en metros.
    Usada para calcular el veredicto de calidad del aire de una zona.
    El campo geom (PostGIS) se agrega en una migracion futura.
    """

    id: UUID
    workspace_id: UUID
    name: str
    center_lat: float
    center_lon: float
    radius_m: float
    created_by: UUID
    created_at: datetime
