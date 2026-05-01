from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MqttConfig:
    host: str
    port: int
    username: str
    password: str
    tls_ca_cert: str | None = None
