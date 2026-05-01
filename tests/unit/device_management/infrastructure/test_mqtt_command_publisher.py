from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.device_management.domain.device_config import DeviceConfig
from src.device_management.infrastructure.mqtt_command_publisher import MqttCommandPublisher
from src.shared.domain.device_id import DeviceId
from src.shared.infrastructure.mqtt.config import MqttConfig


def _config() -> MqttConfig:
    return MqttConfig(host="broker.example.com", port=8883, username="u", password="p")


def _publisher() -> MqttCommandPublisher:
    return MqttCommandPublisher(_config())


def _device_config() -> DeviceConfig:
    return DeviceConfig(sampling_interval_seconds=60, transmission_interval_seconds=300)


@pytest.mark.asyncio
async def test_publishes_to_correct_topic():
    device_id = DeviceId.generate()
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("src.device_management.infrastructure.mqtt_command_publisher.make_client", return_value=mock_client):
        await _publisher().send_config_update(device_id, _device_config())

    expected_topic = f"sana/{device_id.value}/config"
    mock_client.publish.assert_called_once()
    call_kwargs = mock_client.publish.call_args
    assert call_kwargs.args[0] == expected_topic


@pytest.mark.asyncio
async def test_publishes_with_retain_and_qos1():
    device_id = DeviceId.generate()
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("src.device_management.infrastructure.mqtt_command_publisher.make_client", return_value=mock_client):
        await _publisher().send_config_update(device_id, _device_config())

    call_kwargs = mock_client.publish.call_args
    assert call_kwargs.kwargs["qos"] == 1
    assert call_kwargs.kwargs["retain"] is True


@pytest.mark.asyncio
async def test_payload_contains_config_values():
    device_id = DeviceId.generate()
    config = DeviceConfig(sampling_interval_seconds=60, transmission_interval_seconds=300)
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("src.device_management.infrastructure.mqtt_command_publisher.make_client", return_value=mock_client):
        await _publisher().send_config_update(device_id, config)

    call_kwargs = mock_client.publish.call_args
    payload = json.loads(call_kwargs.kwargs["payload"])
    assert payload["sampling_interval_seconds"] == 60
    assert payload["transmission_interval_seconds"] == 300
