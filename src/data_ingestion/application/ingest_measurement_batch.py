from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid7

from shared.domain.coordinate import Coordinate
from shared.domain.device_id import DeviceId

from ..domain.measurement_validator import MeasurementValidator
from ..domain.observation import Observation
from shared.infrastructure.logger import get_logger

from ..domain.ports.repositories import (
    DatastreamRepository,
    LocationUpdater,
    ObservationRepository,
    ProcessedMessageRepository,
)
from ..domain.sensor_reading import SensorReading
from .dtos import IngestBatchDTO

# Códigos de las 9 variables del SEN66, en el mismo orden que SensorReadingDTO.
# Los atributos del DTO están en snake_case; el dominio los espera en uppercase.
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
    """Caso de uso: procesa un batch de mediciones MQTT y lo persiste."""

    def __init__(
        self,
        observation_repo: ObservationRepository,
        processed_msg_repo: ProcessedMessageRepository,
        datastream_repo: DatastreamRepository,
        location_updater: LocationUpdater,
    ) -> None:
        self._observations = observation_repo
        self._processed = processed_msg_repo
        self._datastreams = datastream_repo
        self._location = location_updater
        self._validator = MeasurementValidator()

    async def execute(self, dto: IngestBatchDTO) -> None:
        """Procesa y persiste un batch de mediciones.

        Descarta silenciosamente el batch si el message_id ya fue procesado
        (idempotencia). Si ningún datastream está registrado para el device,
        no se genera ninguna observación y el batch se descarta sin error.
        """
        message_id = UUID(dto.message_id)
        device_id = DeviceId(dto.device_id)

        # Check optimista: evita el procesamiento completo en reintentos del broker.
        # La segunda capa de idempotencia es el UNIQUE constraint en processed_messages.
        if await self._processed.exists(message_id):
            return

        result_time = datetime.now(UTC)
        observations = await self._build_observations(device_id, dto, result_time)

        # Si no se encontró ningún datastream para este device, no hay nada que persistir.
        if not observations:
            _logger.warning(
                "no_datastreams_found",
                device_id=str(device_id),
                message_id=str(message_id),
            )
            return

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
