# ruff: noqa: E402, I001
from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import asyncio
import os
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from data_ingestion.application.ingest_measurement_batch import IngestMeasurementBatch
from data_ingestion.infrastructure.mqtt_telemetry_subscriber import (
    TelemetrySubscriberConfig,
    MqttTelemetrySubscriber,
)
from data_ingestion.infrastructure.postgres_datastream_repo import PostgresDatastreamRepository
from data_ingestion.infrastructure.postgres_location_updater import PostgresLocationUpdater
from data_ingestion.infrastructure.postgres_processed_message_repo import (
    PostgresProcessedMessageRepository,
)
from data_ingestion.infrastructure.timescale_observation_repo import TimescaleObservationRepository
from shared.infrastructure.logger import get_logger

logger = get_logger(__name__)


def _make_use_case(session: AsyncSession, known_devices: set[UUID]) -> IngestMeasurementBatch:
    return IngestMeasurementBatch(
        observation_repo=TimescaleObservationRepository(session),
        processed_msg_repo=PostgresProcessedMessageRepository(session),
        datastream_repo=PostgresDatastreamRepository(session),
        location_updater=PostgresLocationUpdater(session),
        known_devices=known_devices,
    )


async def main() -> None:
    engine = create_async_engine(os.environ["DATABASE_URL"])
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    config = TelemetrySubscriberConfig(
        host=os.environ["MQTT_HOST"],
        port=int(os.environ.get("MQTT_PORT", 1883)),
        username=os.environ["MQTT_USER"],
        password=os.environ["MQTT_PASSWORD"],
        tls_ca_cert=os.environ.get("MQTT_TLS_CA_CERT"),
    )

    subscriber = MqttTelemetrySubscriber(
        config=config,
        session_factory=session_factory,
        use_case_factory=_make_use_case,
    )
    logger.info("ingest_service_starting", host=config.host, port=config.port)
    await subscriber.run()


if __name__ == "__main__":
    loop = asyncio.SelectorEventLoop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        pass
