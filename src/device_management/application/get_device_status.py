from __future__ import annotations

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.errors import DeviceNotFoundError
from ..domain.ports.repositories import DeviceRepository
from .dtos import DeviceStatusOutput

_logger = get_logger(__name__)


class GetDeviceStatusUseCase:
    """Caso de uso: retorna el estado actual de un device."""

    def __init__(self, repo: DeviceRepository) -> None:
        self._repo = repo

    async def execute(self, device_id: str) -> DeviceStatusOutput:
        """Lanza DeviceNotFoundError si el device no existe."""
        did = DeviceId(device_id)
        device = await self._repo.find_by_id(did)
        if device is None:
            _logger.warning("device_not_found", device_id=device_id)
            raise DeviceNotFoundError(f"Device {device_id!r} not found")

        return DeviceStatusOutput(
            device_id=str(device.id),
            code=device.code,
            name=device.name,
            model=device.model,
            status=device.status.value,
            sampling_interval_seconds=device.config.sampling_interval_seconds,
            transmission_interval_seconds=device.config.transmission_interval_seconds,
            keepalive_seconds=device.config.keepalive_seconds,
            last_seen=device.last_seen,
            deactivated_at=device.deactivated_at,
            site_type=device.site_type.value if device.site_type is not None else None,
            latitude=device.location.latitude if device.location is not None else None,
            longitude=device.location.longitude if device.location is not None else None,
            elevation=device.location.elevation if device.location is not None else None,
        )
