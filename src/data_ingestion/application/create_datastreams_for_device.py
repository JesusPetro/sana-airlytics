from __future__ import annotations

from uuid import UUID, uuid7

from shared.domain.device_id import DeviceId

from ..domain.datastream import Datastream
from ..domain.ports.repositories import DatastreamRepository
from ..domain.sen66_catalog import SEN66_CATALOG
from .dtos import DeviceRegisteredEventDTO


class CreateDatastreamsForDevice:
    """Caso de uso: crea los datastreams al registrar un device SEN66."""

    def __init__(self, datastream_repo: DatastreamRepository) -> None:
        self._datastreams = datastream_repo

    async def execute(self, dto: DeviceRegisteredEventDTO) -> None:
        if dto.model != "SEN66":
            raise NotImplementedError(f"Unsupported sensor model: {dto.model!r}")

        device_id = DeviceId(dto.device_id)
        datastreams = [
            Datastream(
                id=UUID(str(uuid7())),
                device_id=device_id,
                observed_property_code=code.upper(),
                unit_code=limits.observed_property.unit_code,
            )
            for code, limits in SEN66_CATALOG.items()
        ]
        await self._datastreams.save_batch(datastreams)
