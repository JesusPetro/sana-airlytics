from __future__ import annotations

from datetime import datetime
from typing import Protocol
from uuid import UUID

from shared.domain.coordinate import Coordinate
from shared.domain.device_id import DeviceId

from ..datastream import Datastream
from ..observation import Observation


class ObservationRepository(Protocol):
    async def save_batch(self, observations: list[Observation]) -> None: ...


class ProcessedMessageRepository(Protocol):
    async def exists(self, message_id: UUID) -> bool: ...
    async def mark_as_processed(self, message_id: UUID) -> None: ...


class DatastreamRepository(Protocol):
    async def find_by_device_and_property(
        self,
        device_id: DeviceId,
        property_code: str,
    ) -> Datastream | None: ...

    async def find_all_by_device(self, device_id: DeviceId) -> list[Datastream]: ...

    async def save(self, datastream: Datastream) -> None: ...


class LocationUpdater(Protocol):
    async def update_location(
        self,
        device_id: DeviceId,
        coordinate: Coordinate,
        timestamp: datetime,
    ) -> None: ...
