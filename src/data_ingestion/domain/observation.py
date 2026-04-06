from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from .processing_level import ProcessingLevel
from .result_qualifier import ResultQualifier


@dataclass(frozen=True)
class Observation:
    id: UUID
    datastream_id: UUID
    phenomenon_time: datetime
    result_time: datetime
    result: float
    processing_level: ProcessingLevel
    qualifier: ResultQualifier

    def __post_init__(self):
        if not math.isfinite(self.result):
            raise ValueError(f"result must be finite, got {self.result}")
