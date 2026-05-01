from __future__ import annotations

import ssl

import aiomqtt

from .config import MqttConfig


def make_client(config: MqttConfig) -> aiomqtt.Client:
    """Construye un aiomqtt.Client listo para usar como async context manager."""
    tls_context: ssl.SSLContext | None = None
    if config.tls_ca_cert:
        tls_context = ssl.create_default_context(cafile=config.tls_ca_cert)

    return aiomqtt.Client(
        hostname=config.host,
        port=config.port,
        username=config.username,
        password=config.password,
        tls_context=tls_context,
    )

