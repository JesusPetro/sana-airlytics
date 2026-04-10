from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid7

import pytest

from src.data_ingestion.application.create_datastreams_for_device import (
    CreateDatastreamsForDevice,
)
from src.data_ingestion.application.dtos import DeviceRegisteredEventDTO
from src.data_ingestion.domain.datastream import Datastream
from src.data_ingestion.domain.processing_level import ProcessingLevel
from src.data_ingestion.domain.sen66_catalog import SEN66_CATALOG
from src.shared.domain.device_id import DeviceId

_DEVICE_ID = str(uuid7())


def _make_repo(existing: Datastream | None = None) -> AsyncMock:
    repo = AsyncMock()
    repo.find_by_device_and_property.return_value = existing
    return repo


@pytest.fixture
def repo():
    return _make_repo()


@pytest.fixture
def use_case(repo):
    return CreateDatastreamsForDevice(datastream_repo=repo)


# --- modelo no SEN66 ---

async def test_non_sen66_model_does_nothing(use_case, repo):
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN55")
    await use_case.execute(dto)
    repo.save.assert_not_called()


# --- creación de datastreams ---

async def test_sen66_creates_l0_and_l1_for_each_variable(use_case, repo):
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    expected_calls = len(SEN66_CATALOG) * 2  # L0 + L1 por variable
    assert repo.save.call_count == expected_calls


async def test_sen66_creates_datastreams_with_uppercase_codes(use_case, repo):
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    saved_codes = {call.args[0].observed_property_code for call in repo.save.call_args_list}
    for code in SEN66_CATALOG:
        assert code.upper() in saved_codes


async def test_sen66_creates_both_processing_levels(use_case, repo):
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    saved_levels = {call.args[0].processing_level for call in repo.save.call_args_list}
    assert ProcessingLevel.L0 in saved_levels
    assert ProcessingLevel.L1 in saved_levels


# --- idempotencia ---

async def test_existing_datastream_is_not_recreated():
    existing = Datastream(
        id=uuid7(),
        device_id=DeviceId(_DEVICE_ID),
        observed_property_code="PM1",
        processing_level=ProcessingLevel.L0,
    )
    repo = _make_repo(existing=existing)
    use_case = CreateDatastreamsForDevice(datastream_repo=repo)

    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    repo.save.assert_not_called()
