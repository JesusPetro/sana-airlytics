from __future__ import annotations

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.ports.repositories import DeviceRepository

_logger = get_logger(__name__)


class MarkDeviceOfflineUseCase:
    """Caso de uso: marca un device como INACTIVE al recibir su LWT."""

    def __init__(self, repo: DeviceRepository) -> None:
        self._repo = repo

    async def execute(self, device_id: str) -> None:
        """Transiciona el device a INACTIVE. Silencioso si el device no existe."""
        did = DeviceId(device_id)
        device = await self._repo.find_by_id(did)
        if device is None:
            # LWT puede llegar para un device ya eliminado — se ignora silenciosamente.
            _logger.info("device_offline_skipped_not_found", device_id=device_id)
            return

        device.mark_offline()
        await self._repo.save(device)
        device.pull_events()  # descartados hasta tener bus de eventos

        _logger.info("device_marked_offline", device_id=device_id, code=device.code)
