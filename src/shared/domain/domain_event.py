from __future__ import annotations

import uuid
from abc import ABC
from dataclasses import KW_ONLY, dataclass, field
from datetime import UTC, datetime


@dataclass(frozen=True)
class DomainEvent(ABC):
    """
    Clase base para todos los eventos de dominio del sistema.

    Un DomainEvent es un hecho inmutable que ya ocurrió dentro del dominio.
    Los eventos no contienen lógica - Son solo datos.
    """

    # KW_ONLY fuerza que event_id y occurred_at sean keyword-only en el __init__
    # generado, evitando el error de "non-default argument follows default argument"
    # cuando las subclases agregan campos sin default (ej. device_id).
    _: KW_ONLY
    event_id: str = field(default_factory=lambda: str(uuid.uuid7()))
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))
