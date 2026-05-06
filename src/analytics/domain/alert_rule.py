from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class AlertRule:
    """
    Regla de alerta asociada a un workspace.
    metric define el tipo: THRESHOLD, SENSOR_OFFLINE o BATTERY_LOW.
    Para THRESHOLD, operator y threshold son obligatorios.
    unit_id es nullable para alertas que no son de tipo THRESHOLD.
    """

    id: UUID
    workspace_id: UUID
    unit_id: UUID | None
    name: str
    metric: str        # 'THRESHOLD' | 'SENSOR_OFFLINE' | 'BATTERY_LOW'
    operator: str | None   # 'GT' | 'LT' | 'GTE' | 'LTE'
    threshold: float | None
    is_active: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime
