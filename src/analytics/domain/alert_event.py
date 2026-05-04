from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class AlertEvent:
    """
    Evento disparado cuando una regla de alerta se activa.
    resolved_at es None mientras el evento sigue activo.
    value es None para alertas de tipo SENSOR_OFFLINE.
    """

    id: UUID
    alert_rule_id: UUID
    triggered_at: datetime
    resolved_at: datetime | None
    value: float | None
    message: str
