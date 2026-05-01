from __future__ import annotations

from shared.infrastructure.logger import get_logger

from ..domain.errors import DeviceAlreadyExistsError, DeviceNotFoundError
from ..domain.ports.repositories import DeviceRepository
from .dtos import ClaimDeviceInput

_logger = get_logger(__name__)


class ClaimDeviceUseCase:
    """Caso de uso: el cliente reclama un sensor PENDING y lo activa en su workspace."""

    def __init__(self, repo: DeviceRepository) -> None:
        self._repo = repo

    async def execute(self, dto: ClaimDeviceInput) -> None:
        """Busca por code, verifica que esté PENDING, asigna workspace y activa."""
        device = await self._repo.find_by_code(dto.code)
        if device is None:
            _logger.warning("device_not_found", code=dto.code)
            raise DeviceNotFoundError(f"Device with code {dto.code!r} not found")

        if device.workspace_id is not None:
            _logger.warning("device_already_claimed", code=dto.code, workspace_id=device.workspace_id)
            raise DeviceAlreadyExistsError(f"Device {dto.code!r} is already claimed by another workspace")

        device.claim(dto.workspace_id)
        await self._repo.save(device)
        device.pull_events()  # descartados hasta tener bus de eventos

        _logger.info("device_claimed", code=dto.code, workspace_id=dto.workspace_id)
