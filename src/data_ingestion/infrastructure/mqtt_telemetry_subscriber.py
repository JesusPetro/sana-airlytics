from __future__ import annotations

import asyncio
import json
import ssl
from dataclasses import dataclass
from datetime import UTC, datetime

import aiomqtt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from data_ingestion.application.dtos import (
    GpsDTO,
    HardwareMetadataDTO,
    IngestBatchDTO,
    SensorReadingDTO,
    VariableReadingDTO,
)
from data_ingestion.application.ingest_measurement_batch import IngestMeasurementBatch
from data_ingestion.infrastructure.postgres_datastream_repo import PostgresDatastreamRepository
from data_ingestion.infrastructure.postgres_location_updater import PostgresLocationUpdater
from data_ingestion.infrastructure.postgres_processed_message_repo import (
    PostgresProcessedMessageRepository,
)
from data_ingestion.infrastructure.timescale_observation_repo import TimescaleObservationRepository
from shared.infrastructure.logger import get_logger

logger = get_logger(__name__)

_SEN66_VARIABLES = (
    "pm1", "pm2_5", "pm4", "pm10",
    "temperature", "humidity", "voc_index", "nox_index", "co2",
)


@dataclass
class MqttConfig:
    host: str
    port: int
    username: str
    password: str
    topic: str = "sana/+/telemetry"
    max_concurrent_batches: int = 10
    tls_ca_cert: str | None = None


class MqttTelemetrySubscriber:
    def __init__(
        self, config: MqttConfig, session_factory: async_sessionmaker[AsyncSession]
    ) -> None:
        self._config = config
        self._session_factory = session_factory
        self._semaphore = asyncio.Semaphore(config.max_concurrent_batches)
        self._known_devices: set[str] = set()

    async def run(self) -> None:
        async with self._session_factory() as session:
            self._known_devices = await PostgresDatastreamRepository(session).find_all_device_ids()
        logger.info("device_cache_loaded", count=len(self._known_devices))

        tls_context: ssl.SSLContext | None = None
        if self._config.tls_ca_cert:
            tls_context = ssl.create_default_context(cafile=self._config.tls_ca_cert)

        async with aiomqtt.Client(
            hostname=self._config.host,
            port=self._config.port,
            username=self._config.username,
            password=self._config.password,
            tls_context=tls_context,
        ) as client:
            await client.subscribe(self._config.topic, qos=1)
            logger.info(
                "mqtt_connected",
                host=self._config.host,
                port=self._config.port,
                topic=self._config.topic,
            )
            async for message in client.messages:
                asyncio.create_task(self._handle(message))

    async def _handle(self, message: aiomqtt.Message) -> None:
        async with self._semaphore:
            logger.info("mqtt_message_received", topic=str(message.topic))
            try:
                payload = json.loads(message.payload)
            except (json.JSONDecodeError, UnicodeDecodeError):
                logger.error("malformed_mqtt_payload", topic=str(message.topic))
                return

            try:
                dto = _parse(payload)
            except (KeyError, TypeError, ValueError):
                logger.error(
                    "invalid_payload_structure",
                    topic=str(message.topic),
                    message_id=payload.get("message_id"),
                )
                return

            # Sesión propia por mensaje — evita conflictos entre tareas concurrentes.
            # Si el caso de uso lanza excepcion, la tarea falla sin ACK
            # y EMQX reentrega el mensaje. La idempotencia por message_id previene duplicados.
            message_id = payload.get("message_id")
            try:
                async with self._session_factory() as session:
                    use_case = IngestMeasurementBatch(
                        observation_repo=TimescaleObservationRepository(session),
                        processed_msg_repo=PostgresProcessedMessageRepository(session),
                        datastream_repo=PostgresDatastreamRepository(session),
                        location_updater=PostgresLocationUpdater(session),
                        known_devices=self._known_devices,
                    )
                    await use_case.execute(dto)
                    await session.commit()
                logger.info(
                    "batch_ingested",
                    message_id=message_id,
                    device_id=dto.device_id,
                    reading_count=len(dto.readings),
                )
            except Exception:
                logger.exception(
                    "batch_ingest_failed",
                    message_id=message_id,
                    device_id=dto.device_id,
                )


def _parse(payload: dict) -> IngestBatchDTO:
    raw_meta = payload["metadata"]
    raw_gps = raw_meta.get("gps")
    gps = (
        GpsDTO(lat=raw_gps["lat"], lon=raw_gps["lon"], alt=raw_gps["alt"])
        if raw_gps is not None
        else None
    )
    metadata = HardwareMetadataDTO(
        battery_pct=raw_meta["battery_pct"],
        rssi_dbm=raw_meta["rssi_dbm"],
        uptime_s=raw_meta["uptime_s"],
        gps=gps,
    )
    readings = [_parse_reading(r) for r in payload["readings"]]
    return IngestBatchDTO(
        message_id=payload["message_id"],
        device_id=payload["device_id"],
        readings=readings,
        metadata=metadata,
    )


def _parse_reading(raw: dict) -> SensorReadingDTO:
    return SensorReadingDTO(
        timestamp=datetime.fromisoformat(raw["timestamp"]).replace(tzinfo=UTC),
        **{code: VariableReadingDTO(**raw[code]) for code in _SEN66_VARIABLES},
    )
