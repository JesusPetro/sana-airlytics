from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class SensorReading:
    variable_code: str
    value: float
    phenomenon_time: datetime
    has_error: bool
