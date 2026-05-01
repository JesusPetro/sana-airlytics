from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Callable
from uuid import UUID

import aiomqtt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from data_ingestion.application.ingest_measurement_batch import IngestMeasurementBatch
from data_ingestion.infrastructure.postgres_datastream_repo import PostgresDatastreamRepository
from data_ingestion.infrastructure.sen66_payload_parser import SEN66PayloadParser
from shared.infrastructure.logger import get_logger
from shared.infrastructure.mqtt.client import make_client
from shared.infrastructure.mqtt.config import MqttConfig

logger = get_logger(__name__)


@dataclass
class TelemetrySubscriberConfig(MqttConfig):
    topic: str = "sana/+/telemetry"
    max_concurrent_batches: int = 10


class MqttTelemetrySubscriber:
    def __init__(
        self,
        config: TelemetrySubscriberConfig,
        session_factory: async_sessionmaker[AsyncSession],
        use_case_factory: Callable[[AsyncSession, set[UUID]], IngestMeasurementBatch],
    ) -> None:
        self._config = config
        self._session_factory = session_factory
        self._use_case_factory = use_case_factory
        self._semaphore = asyncio.Semaphore(config.max_concurrent_batches)
        self._known_devices: set[UUID] = set()

    async def run(self) -> None:
        async with self._session_factory() as session:
            self._known_devices = await PostgresDatastreamRepository(session).find_all_device_ids()
        logger.info("device_cache_loaded", count=len(self._known_devices))

        async with make_client(self._config) as client:
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
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                logger.error(
                    "malformed_mqtt_payload",
                    topic=str(message.topic),
                    error=str(exc),
                    exc_info=True,
                )
                return

            try:
                dto = SEN66PayloadParser.parse(payload)
            except (KeyError, TypeError, ValueError) as exc:
                logger.error(
                    "invalid_payload_structure",
                    topic=str(message.topic),
                    message_id=payload.get("message_id"),
                    error=str(exc),
                    exc_info=True,
                )
                return

            message_id = payload.get("message_id")
            try:
                async with self._session_factory() as session:
                    use_case = self._use_case_factory(session, self._known_devices)
                    await use_case.execute(dto)
                    await session.commit()
                logger.info(
                    "batch_ingested",
                    message_id=message_id,
                    device_id=dto.device_id,
                    reading_count=len(dto.readings),
                )
            except IntegrityError:
                logger.warning(
                    "device_not_registered",
                    message_id=message_id,
                    device_id=dto.device_id,
                )
            except Exception:
                logger.exception(
                    "batch_ingest_failed",
                    message_id=message_id,
                    device_id=dto.device_id,
                )
