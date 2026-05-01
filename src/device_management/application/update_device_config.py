from __future__ import annotations

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.device_config import DeviceConfig
from ..domain.errors import DeviceNotFoundError
from ..domain.ports.publishers import CommandPublisher
from ..domain.ports.repositories import DeviceRepository
from .dtos import UpdateDeviceConfigInput

_logger = get_logger(__name__)


class UpdateDeviceConfigUseCase:
    """Caso de uso: actualiza la configuracion operativa de un device."""

    def __init__(self, repo: DeviceRepository, publisher: CommandPublisher) -> None:
        self._repo = repo
        self._publisher = publisher

    async def execute(self, dto: UpdateDeviceConfigInput) -> None:
        """Aplica la nueva config al device; lanza DeviceNotFoundError si no existe."""
        did = DeviceId(dto.device_id)
        device = await self._repo.find_by_id(did)
        if device is None:
            _logger.warning("device_not_found", device_id=dto.device_id)
            raise DeviceNotFoundError(f"Device {dto.device_id!r} not found")

        try:
            new_config = DeviceConfig(
                sampling_interval_seconds=dto.sampling_interval_seconds,
                transmission_interval_seconds=dto.transmission_interval_seconds,
            )
        except ValueError:
            _logger.exception("invalid_device_config", device_id=dto.device_id)
            raise

        device.update_config(new_config)
        await self._repo.save(device)
        device.pull_events()

        await self._publisher.send_config_update(device.id, new_config)

        _logger.info(
            "device_config_updated",
            device_id=dto.device_id,
            sampling=dto.sampling_interval_seconds,
            transmission=dto.transmission_interval_seconds,
        )
