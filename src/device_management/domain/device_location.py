from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SiteType(Enum):
    INDOOR = "INDOOR"
    OUTDOOR = "OUTDOOR"
    MOBILE = "MOBILE"


@dataclass(frozen=True)
class DeviceLocation:
    latitude: float
    longitude: float
    elevation: float | None
    site_type: SiteType
