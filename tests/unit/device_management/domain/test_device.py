from __future__ import annotations

from datetime import UTC, datetime

import pytest

from src.device_management.domain.device import Device
from src.device_management.domain.device_events import (
    DeviceClaimedEvent,
    DeviceOfflineEvent,
    DeviceRegisteredEvent,
)
from src.device_management.domain.device_status import DeviceStatus
from src.device_management.domain.site_type import SiteType
from src.shared.domain.device_id import DeviceId

_ID = DeviceId.generate()
_WS = "ws-123"


def _make_device(**overrides) -> Device:
    defaults = dict(
        id=_ID,
        code="SANA-001",
        name="Sensor Patio",
        model="SEN66",
    )
    defaults.update(overrides)
    return Device(**defaults)


# --- validaciones de __init__ ---

def test_empty_code_raises():
    with pytest.raises(ValueError, match="code"):
        _make_device(code="")


def test_blank_code_raises():
    with pytest.raises(ValueError, match="code"):
        _make_device(code="   ")


def test_code_too_long_raises():
    with pytest.raises(ValueError, match="code"):
        _make_device(code="A" * 65)


def test_empty_name_raises():
    with pytest.raises(ValueError, match="name"):
        _make_device(name="")


def test_empty_model_raises():
    with pytest.raises(ValueError, match="model"):
        _make_device(model="")


def test_code_normalized_to_uppercase():
    device = _make_device(code="sana-001")
    assert device.code == "SANA-001"


# --- eventos de dominio ---

def test_init_emits_registered_event():
    device = _make_device()
    events = device.pull_events()
    assert len(events) == 1
    assert isinstance(events[0], DeviceRegisteredEvent)


def test_pull_events_clears_list():
    device = _make_device()
    device.pull_events()
    assert device.pull_events() == []


# --- ciclo de vida ---

def test_initial_status_is_pending():
    device = _make_device()
    assert device.status == DeviceStatus.PENDING


def test_initial_workspace_is_none():
    device = _make_device()
    assert device.workspace_id is None


def test_claim_transitions_to_active():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    assert device.status == DeviceStatus.ACTIVE


def test_claim_sets_workspace():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    assert device.workspace_id == _WS


def test_claim_emits_claimed_event():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    events = device.pull_events()
    assert any(isinstance(e, DeviceClaimedEvent) for e in events)


def test_claim_is_idempotent_same_workspace():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    device.pull_events()
    device.claim(_WS)
    assert device.pull_events() == []


def test_mark_offline_transitions_to_inactive():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    device.pull_events()
    device.mark_offline()
    assert device.status == DeviceStatus.INACTIVE


def test_mark_offline_emits_offline_event():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    device.pull_events()
    device.mark_offline()
    events = device.pull_events()
    assert any(isinstance(e, DeviceOfflineEvent) for e in events)


def test_mark_offline_is_idempotent():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    device.pull_events()
    device.mark_offline()
    device.pull_events()
    device.mark_offline()
    assert device.pull_events() == []


# --- heartbeat ---

def test_record_heartbeat_updates_last_seen():
    device = _make_device()
    now = datetime.now(UTC)
    device.record_heartbeat(now)
    assert device.last_seen == now


def test_record_heartbeat_reactivates_from_inactive_when_claimed():
    device = _make_device()
    device.pull_events()
    device.claim(_WS)
    device.pull_events()
    device.mark_offline()
    device.pull_events()
    device.record_heartbeat(datetime.now(UTC))
    assert device.status == DeviceStatus.ACTIVE


def test_record_heartbeat_does_not_activate_unclaimed_device():
    device = _make_device()
    device.pull_events()
    device.record_heartbeat(datetime.now(UTC))
    assert device.status == DeviceStatus.PENDING


# --- site_type ---

def test_site_type_stored_correctly():
    device = _make_device(site_type=SiteType.OUTDOOR)
    assert device.site_type == SiteType.OUTDOOR


def test_site_type_defaults_to_none():
    device = _make_device()
    assert device.site_type is None
