from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DeviceLocation:
    latitude: float
    longitude: float
    elevation: float | None
