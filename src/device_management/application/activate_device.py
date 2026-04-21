from __future__ import annotations

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.errors import DeviceNotFoundError
from ..domain.ports.repositories import DeviceRepository

_logger = get_logger(__name__)


class ActivateDeviceUseCase:
    """Caso de uso: activa un device existente."""

    def __init__(self, repo: DeviceRepository) -> None:
        self._repo = repo

    async def execute(self, device_id: str) -> None:
        """Transiciona el device a ACTIVE; lanza DeviceNotFoundError si no existe."""
        did = DeviceId(device_id)
        device = await self._repo.find_by_id(did)
        if device is None:
            _logger.warning("device_not_found", device_id=device_id)
            raise DeviceNotFoundError(f"Device {device_id!r} not found")

        device.activate()
        await self._repo.save(device)
        device.pull_events()  # descartados hasta tener bus de eventos

        _logger.info("device_activated", device_id=device_id, code=device.code)
