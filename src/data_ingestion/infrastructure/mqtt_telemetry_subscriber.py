from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import UTC, datetime

import aiomqtt

from data_ingestion.application.dtos import (
    GpsDTO,
    HardwareMetadataDTO,
    IngestBatchDTO,
    SensorReadingDTO,
    VariableReadingDTO,
)
from data_ingestion.application.ingest_measurement_batch import IngestMeasurementBatch
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


class MqttTelemetrySubscriber:
    def __init__(self, config: MqttConfig, use_case: IngestMeasurementBatch) -> None:
        self._config = config
        self._use_case = use_case
        self._semaphore = asyncio.Semaphore(config.max_concurrent_batches)

    async def run(self) -> None:
        async with aiomqtt.Client(
            hostname=self._config.host,
            port=self._config.port,
            username=self._config.username,
            password=self._config.password,
        ) as client:
            await client.subscribe(self._config.topic, qos=1)
            async for message in client.messages:
                asyncio.create_task(self._handle(message))

    async def _handle(self, message: aiomqtt.Message) -> None:
        async with self._semaphore:
            try:
                payload = json.loads(message.payload)
            except (json.JSONDecodeError, UnicodeDecodeError):
                logger.error(
                    "malformed_mqtt_payload",
                    topic=str(message.topic),
                )
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

            # Si el caso de uso lanza excepcion, la tarea falla sin ACK
            # y EMQX reentrega el mensaje. La idempotencia por message_id previene duplicados.
            await self._use_case.execute(dto)


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
