from __future__ import annotations

from uuid import UUID, uuid7

from shared.domain.device_id import DeviceId

from ..domain.datastream import Datastream
from ..domain.ports.repositories import DatastreamRepository
from ..domain.processing_level import ProcessingLevel
from ..domain.sen66_catalog import SEN66_CATALOG
from .dtos import DeviceRegisteredEventDTO


class CreateDatastreamsForDevice:
    """Caso de uso: crea los datastreams L0 y L1 al registrar un device SEN66."""

    def __init__(self, datastream_repo: DatastreamRepository) -> None:
        self._datastreams = datastream_repo

    async def execute(self, dto: DeviceRegisteredEventDTO) -> None:
        """Crea 2 × 9 datastreams (L0 + L1 por cada variable del SEN66).

        Idempotente: si los datastreams ya existen no se recrean.
        Puede ejecutarse múltiples veces sin efectos secundarios.
        """
        device_id = DeviceId(dto.device_id)

        # MVP scope: solo SEN66. Ignorar otros modelos hasta implementar multi-modelo.
        if dto.model != "SEN66":
            return

        for code in SEN66_CATALOG:
            for level in (ProcessingLevel.L0, ProcessingLevel.L1):
                await self._create_if_not_exists(device_id, code.upper(), level)

    async def _create_if_not_exists(
        self,
        device_id: DeviceId,
        property_code: str,
        level: ProcessingLevel,
    ) -> None:
        """Crea el datastream solo si no existe para este device, variable y nivel."""
        existing = await self._datastreams.find_by_device_and_property(
            device_id, property_code, level
        )
        if existing is not None:
            return

        await self._datastreams.save(Datastream(
            id=UUID(str(uuid7())),
            device_id=device_id,
            observed_property_code=property_code,
            processing_level=level,
        ))
