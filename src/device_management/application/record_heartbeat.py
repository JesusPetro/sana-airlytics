from __future__ import annotations

from datetime import UTC, datetime

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.ports.repositories import DeviceRepository

_logger = get_logger(__name__)


class RecordHeartbeatUseCase:
    """Caso de uso: registra actividad reciente de un device y lo reactiva si estaba INACTIVE."""

    def __init__(self, repo: DeviceRepository) -> None:
        self._repo = repo

    async def execute(self, device_id: str) -> None:
        """Actualiza last_seen y reactiva el device si aplica. Silencioso si no existe."""
        did = DeviceId(device_id)
        device = await self._repo.find_by_id(did)
        if device is None:
            _logger.info("heartbeat_skipped_not_found", device_id=device_id)
            return

        device.record_heartbeat(datetime.now(UTC))
        await self._repo.save(device)
        device.pull_events()  # descartados hasta tener bus de eventos

        _logger.info("heartbeat_recorded", device_id=device_id, code=device.code)
