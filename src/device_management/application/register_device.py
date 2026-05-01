from __future__ import annotations

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.device import Device
from ..domain.errors import DeviceAlreadyExistsError
from ..domain.ports.repositories import DeviceRepository
from ..domain.site_type import SiteType
from .dtos import RegisterDeviceInput, RegisterDeviceOutput

_logger = get_logger(__name__)


class RegisterDeviceUseCase:
    """Caso de uso: registra un device nuevo en el sistema."""

    def __init__(self, repo: DeviceRepository) -> None:
        self._repo = repo

    async def execute(self, dto: RegisterDeviceInput) -> RegisterDeviceOutput:
        """Crea el device si el code no existe; lanza DeviceAlreadyExistsError si ya existe."""
        existing = await self._repo.find_by_code(dto.code)
        if existing is not None:
            _logger.warning("device_already_exists", code=dto.code)
            raise DeviceAlreadyExistsError(f"Device with code {dto.code!r} already exists")

        site_type = SiteType(dto.site_type) if dto.site_type is not None else None
        device_id = DeviceId.generate()

        try:
            device = Device(
                id=device_id,
                code=dto.code,
                name=dto.name,
                model=dto.model,
                site_type=site_type,
            )
        except ValueError:
            _logger.exception("device_creation_failed", code=dto.code, model=dto.model)
            raise

        await self._repo.save(device)
        device.pull_events()  # descartados hasta tener bus de eventos

        _logger.info(
            "device_registered",
            device_id=str(device_id),
            code=device.code,
            model=device.model,
        )

        return RegisterDeviceOutput(device_id=str(device_id), code=device.code)
