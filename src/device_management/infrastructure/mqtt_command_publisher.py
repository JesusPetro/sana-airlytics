from __future__ import annotations

import json

from shared.domain.device_id import DeviceId
from shared.infrastructure.logger import get_logger
from shared.infrastructure.mqtt.client import make_client
from shared.infrastructure.mqtt.config import MqttConfig

from device_management.domain.device_config import DeviceConfig

logger = get_logger(__name__)

_CONFIG_TOPIC = "sana/{device_id}/config"


class MqttCommandPublisher:
    """Publica comandos de configuración al device físico vía MQTT."""

    def __init__(self, config: MqttConfig) -> None:
        self._config = config

    async def send_config_update(self, device_id: DeviceId, config: DeviceConfig) -> None:
        """Serializa la config y la publica en el tópico del device con retain=True."""
        topic = _CONFIG_TOPIC.format(device_id=device_id.value)
        payload = json.dumps({
            "sampling_interval_seconds": config.sampling_interval_seconds,
            "transmission_interval_seconds": config.transmission_interval_seconds,
        })

        async with make_client(self._config) as client:
            await client.publish(topic, payload=payload, qos=1, retain=True)

        logger.info(
            "config_published",
            device_id=str(device_id.value),
            topic=topic,
            sampling=config.sampling_interval_seconds,
            transmission=config.transmission_interval_seconds,
        )
