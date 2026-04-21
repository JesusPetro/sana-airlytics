from __future__ import annotations

import pytest

from src.device_management.domain.device_config import DeviceConfig


def test_valid_config():
    config = DeviceConfig(sampling_interval_seconds=60, transmission_interval_seconds=300)
    assert config.keepalive_seconds == 150


def test_keepalive_is_half_transmission():
    config = DeviceConfig(sampling_interval_seconds=30, transmission_interval_seconds=200)
    assert config.keepalive_seconds == 100


def test_sampling_below_minimum_raises():
    with pytest.raises(ValueError, match="sampling_interval"):
        DeviceConfig(sampling_interval_seconds=29, transmission_interval_seconds=300)


def test_transmission_below_minimum_raises():
    with pytest.raises(ValueError, match="transmission_interval"):
        DeviceConfig(sampling_interval_seconds=30, transmission_interval_seconds=149)


def test_transmission_below_sampling_raises():
    with pytest.raises(ValueError, match="transmission_interval"):
        DeviceConfig(sampling_interval_seconds=300, transmission_interval_seconds=150)


def test_sampling_equals_transmission_is_valid():
    config = DeviceConfig(sampling_interval_seconds=150, transmission_interval_seconds=150)
    assert config.sampling_interval_seconds == config.transmission_interval_seconds
