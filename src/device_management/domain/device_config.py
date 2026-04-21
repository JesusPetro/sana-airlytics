from __future__ import annotations

from dataclasses import dataclass

from .device_limits import DeviceConfigLimits


@dataclass(frozen=True)
class DeviceConfig:
    sampling_interval_seconds: int
    transmission_interval_seconds: int

    def __post_init__(self) -> None:
        min_sampling = DeviceConfigLimits.SAMPLING_INTERVAL_MIN_SECONDS
        min_transmission = DeviceConfigLimits.TRANSMISSION_INTERVAL_MIN_SECONDS

        if self.sampling_interval_seconds < min_sampling:
            raise ValueError(
                f"sampling_interval must be >= {min_sampling}s, "
                f"got {self.sampling_interval_seconds}"
            )
        if self.transmission_interval_seconds < min_transmission:
            raise ValueError(
                f"transmission_interval must be >= {min_transmission}s, "
                f"got {self.transmission_interval_seconds}"
            )
        if self.transmission_interval_seconds < self.sampling_interval_seconds:
            raise ValueError(
                f"transmission_interval ({self.transmission_interval_seconds}s) "
                f"must be >= sampling_interval ({self.sampling_interval_seconds}s)"
            )

    @property
    def keepalive_seconds(self) -> int:
        return self.transmission_interval_seconds // 2
