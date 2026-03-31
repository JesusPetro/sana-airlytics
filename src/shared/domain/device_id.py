from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class DeviceId:
    """
    Objeto de valor inmutable para identificadores de dispositivos.
    Igual por valor, no por referencia.
    """
    value: str

    def __post_init__(self) -> None:
        try:
            uuid.UUID(self.value)
        except ValueError:
            raise ValueError(f"Invalid DeviceId format: '{self.value}'") from None

    @classmethod
    def generate(cls) -> DeviceId:
        return cls(str(uuid.uuid7()))

    def __str__(self) -> str:
        return self.value

    def __repr__(self) -> str:
        return f'DeviceId({self.value})'

