from __future__ import annotations

from unittest.mock import patch

import pytest

from src.shared.infrastructure.mqtt.client import make_client
from src.shared.infrastructure.mqtt.config import MqttConfig


def _config(**kwargs) -> MqttConfig:
    return MqttConfig(
        host="broker.example.com",
        port=1883,
        username="user",
        password="pass",
        **kwargs,
    )


class TestMakeClient:
    @pytest.mark.asyncio
    async def test_no_tls_when_ca_cert_is_none(self):
        with patch("ssl.create_default_context") as mock_tls:
            make_client(_config(tls_ca_cert=None))
            mock_tls.assert_not_called()

    @pytest.mark.asyncio
    async def test_tls_context_built_when_ca_cert_provided(self, tmp_path):
        ca_cert = tmp_path / "ca.crt"
        ca_cert.write_text("fake-cert")

        with patch("ssl.create_default_context") as mock_tls:
            make_client(_config(tls_ca_cert=str(ca_cert)))
            mock_tls.assert_called_once_with(cafile=str(ca_cert))
