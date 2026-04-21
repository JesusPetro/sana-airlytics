from __future__ import annotations

from typing import Protocol

from shared.domain.device_id import DeviceId

from ..device import Device


class DeviceRepository(Protocol):
    """Contrato de persistencia para el agregado Device."""

    async def save(self, device: Device) -> None:
        """Inserta o actualiza el device. Upsert por id."""
        ...

    async def find_by_id(self, device_id: DeviceId) -> Device | None:
        """Retorna None si el device no existe."""
        ...

    async def find_by_code(self, code: str) -> Device | None:
        """Busqueda case-insensitive. El code siempre esta en uppercase en BD."""
        ...

    async def find_by_workspace(self, workspace_id: str) -> list[Device]:
        """Retorna todos los devices del workspace que no esten soft-deleted."""
        ...
