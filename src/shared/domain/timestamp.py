from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class Timestamp:
    value: datetime

    def __post_init__(self) -> None:
        if self.value.tzinfo is None:
            raise ValueError("Timestamp must be timezone-aware")

    @classmethod
    def now(cls) -> Timestamp:
        return cls(datetime.now(UTC))

    @classmethod
    def from_iso(cls, iso_string: str) -> Timestamp:
        return cls(datetime.fromisoformat(iso_string))

    def is_before(self, other: Timestamp) -> bool:
        return self.value < other.value

    def is_in_future(self) -> bool:
        return self.value > datetime.now(UTC)
