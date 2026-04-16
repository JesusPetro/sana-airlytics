from __future__ import annotations

import asyncio
import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from data_ingestion.infrastructure.mqtt_telemetry_subscriber import (
    MqttConfig,
    MqttTelemetrySubscriber,
)
from shared.infrastructure.logger import get_logger

load_dotenv(override=True)

logger = get_logger(__name__)


async def main() -> None:
    engine = create_async_engine(os.environ["DATABASE_URL"])
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    config = MqttConfig(
        host=os.environ["MQTT_HOST"],
        port=int(os.environ.get("MQTT_PORT", 1883)),
        username=os.environ["MQTT_USER"],
        password=os.environ["MQTT_PASSWORD"],
        tls_ca_cert=os.environ.get("MQTT_TLS_CA_CERT"),
    )

    subscriber = MqttTelemetrySubscriber(config=config, session_factory=session_factory)
    logger.info("ingest_service_starting", host=config.host, port=config.port)
    await subscriber.run()


if __name__ == "__main__":
    loop = asyncio.SelectorEventLoop()
    loop.run_until_complete(main())
