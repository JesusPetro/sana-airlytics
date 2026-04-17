from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from .result_qualifier import ResultQualifier


@dataclass(frozen=True)
class Observation:
    id: UUID
    datastream_id: UUID
    phenomenon_time: datetime
    result_time: datetime
    result: float
    qualifier: ResultQualifier

    def __post_init__(self):
        if not math.isfinite(self.result):
            raise ValueError(f"result must be finite, got {self.result}")
        if self.phenomenon_time.tzinfo is None:
            raise ValueError("phenomenon_time must be timezone-aware")
        if self.result_time.tzinfo is None:
            raise ValueError("result_time must be timezone-aware")
