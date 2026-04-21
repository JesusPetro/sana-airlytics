from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from shared.domain.device_id import DeviceId
from shared.domain.domain_event import DomainEvent


@dataclass(frozen=True)
class DeviceRegisteredEvent(DomainEvent):
    device_id: DeviceId
    workspace_id: str
    code: str
    model: str


@dataclass(frozen=True)
class DeviceActivatedEvent(DomainEvent):
    device_id: DeviceId


@dataclass(frozen=True)
class DeviceOfflineEvent(DomainEvent):
    device_id: DeviceId
    last_seen: datetime | None


@dataclass(frozen=True)
class DeviceConfigUpdatedEvent(DomainEvent):
    device_id: DeviceId
    new_sampling_interval: int
    new_transmission_interval: int
