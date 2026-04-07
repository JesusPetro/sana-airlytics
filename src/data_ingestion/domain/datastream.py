from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from shared.domain.device_id import DeviceId

from .processing_level import ProcessingLevel


@dataclass(frozen=True)
class Datastream:
    id: UUID
    device_id: DeviceId
    observed_property_code: str
    processing_level: ProcessingLevel
