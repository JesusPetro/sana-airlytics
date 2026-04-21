from __future__ import annotations

from typing import Protocol

from shared.domain.device_id import DeviceId

from ..device_config import DeviceConfig


class CommandPublisher(Protocol):
    """Contrato para enviar comandos de configuracion al device fisico via MQTT."""

    async def send_config_update(self, device_id: DeviceId, config: DeviceConfig) -> None:
        """Publica la nueva config en sana/{device_id}/config con retain=True."""
        ...
