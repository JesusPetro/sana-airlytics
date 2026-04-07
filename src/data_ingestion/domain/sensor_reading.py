from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class SensorReading:
    variable_code: str
    value: float
    phenomenon_time: datetime
    has_error: bool

    def __post_init__(self):
        if self.phenomenon_time.tzinfo is None:
            raise ValueError("phenomenon_time must be timezone-aware")
