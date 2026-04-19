from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid7

from shared.domain.coordinate import Coordinate
from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger

from ..domain.measurement_validator import MeasurementValidator
from ..domain.observation import Observation
from ..domain.ports.repositories import (
    DatastreamRepository,
    LocationUpdater,
    ObservationRepository,
    ProcessedMessageRepository,
)
from ..domain.sensor_reading import SensorReading
from .create_datastreams_for_device import CreateDatastreamsForDevice
from .dtos import DeviceRegisteredEventDTO, IngestBatchDTO

_logger = get_logger(__name__)

_SEN66_VARIABLE_CODES: tuple[str, ...] = (
    "pm1",
    "pm2_5",
    "pm4",
    "pm10",
    "temperature",
    "humidity",
    "voc_index",
    "nox_index",
    "co2",
)


class IngestMeasurementBatch:
    def __init__(
        self,
        observation_repo: ObservationRepository,
        processed_msg_repo: ProcessedMessageRepository,
        datastream_repo: DatastreamRepository,
        location_updater: LocationUpdater,
        known_devices: set[str],
    ) -> None:
        self._observations = observation_repo
        self._processed = processed_msg_repo
        self._datastreams = datastream_repo
        self._location = location_updater
        self._known_devices = known_devices
        self._validator = MeasurementValidator()
        self._create_datastreams = CreateDatastreamsForDevice(datastream_repo)

    async def execute(self, dto: IngestBatchDTO) -> None:
        message_id = UUID(dto.message_id)
        device_id = DeviceId(dto.device_id)

        # Check optimista: evita el procesamiento completo en reintentos del broker.
        # La segunda capa de idempotencia es el UNIQUE constraint en processed_messages.
        if await self._processed.exists(message_id):
            return

        if dto.device_id not in self._known_devices:
            await self._create_datastreams.execute(
                DeviceRegisteredEventDTO(device_id=dto.device_id, model="SEN66")
            )
            self._known_devices.add(dto.device_id)
            _logger.info(
                "device_registered_on_demand",
                device_id=dto.device_id,
                message_id=str(message_id),
            )

        result_time = datetime.now(UTC)
        observations = await self._build_observations(device_id, dto, result_time)

        await self._update_location_if_present(device_id, dto, result_time)

        # Persistencia separada: save_batch escribe observaciones; mark_as_processed
        # registra el message_id. Si save_batch falla, el message_id no queda marcado
        # y EMQX reentregará el mensaje — la idempotencia previene duplicados.
        await self._observations.save_batch(observations)
        await self._processed.mark_as_processed(message_id)

    async def _build_observations(
        self,
        device_id: DeviceId,
        dto: IngestBatchDTO,
        result_time: datetime,
    ) -> list[Observation]:
        """Construye las observaciones para todas las lecturas del batch."""
        observations: list[Observation] = []

        for reading_dto in dto.readings:
            for code in _SEN66_VARIABLE_CODES:
                var_dto = getattr(reading_dto, code)
                reading = SensorReading(
                    variable_code=code.upper(),
                    value=var_dto.value,
                    phenomenon_time=reading_dto.timestamp,
                    has_error=var_dto.error,
                )
                await self._append_observation(observations, device_id, reading, result_time)

        return observations

    async def _append_observation(
        self,
        observations: list[Observation],
        device_id: DeviceId,
        reading: SensorReading,
        result_time: datetime,
    ) -> None:
        """Agrega la observación de una lectura a la lista acumulada.

        Si no existe el datastream correspondiente para este device y variable,
        omite sin lanzar error (device sin datastreams registrados).
        """
        ds = await self._datastreams.find_by_device_and_property(
            device_id, reading.variable_code
        )
        if ds is None:
            return

        qualifier = self._validator.validate(reading)
        observations.append(
            Observation(
                id=UUID(str(uuid7())),
                datastream_id=ds.id,
                phenomenon_time=reading.phenomenon_time,
                result_time=result_time,
                result=reading.value,
                qualifier=qualifier,
            )
        )

    async def _update_location_if_present(
        self,
        device_id: DeviceId,
        dto: IngestBatchDTO,
        timestamp: datetime,
    ) -> None:
        """Actualiza la ubicación del device si el payload incluye GPS válido.

        Coordinate valida los rangos en su __post_init__, por lo que no hace
        falta validar lat/lon aquí.
        """
        gps = dto.metadata.gps
        if gps is None:
            return

        await self._location.update_location(
            device_id,
            Coordinate(latitude=gps.lat, longitude=gps.lon, altitude=gps.alt),
            timestamp,
        )
