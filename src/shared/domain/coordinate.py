from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Coordinate:
    """Par latitud/longitud/altitud validado. Value Object inmutable"""

    latitude: float
    longitude: float
    altitude: float | None = None

    def __post_init__(self) -> None:
        if not -90 <= self.latitude <= 90:
            raise ValueError(f"Latitude {self.latitude} out of range [-90, 90]")
        if not -180 <= self.longitude <= 180:
            raise ValueError(f"Longitude {self.longitude} out of range [-180, 180]")
