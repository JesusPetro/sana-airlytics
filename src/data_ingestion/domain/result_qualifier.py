from __future__ import annotations

from enum import Enum


class ResultQualifier(Enum):
    VALID = "VALID"
    SUSPICIOUS_VALUE = "SUSPICIOUS_VALUE"
    SENSOR_OUT_OF_RANGE = "SENSOR_OUT_OF_RANGE"
