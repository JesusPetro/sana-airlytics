from __future__ import annotations

from unittest.mock import AsyncMock, call
from uuid import uuid7

import pytest

from src.data_ingestion.application.create_datastreams_for_device import (
    CreateDatastreamsForDevice,
)
from src.data_ingestion.application.dtos import DeviceRegisteredEventDTO
from src.data_ingestion.domain.sen66_catalog import SEN66_CATALOG

_DEVICE_ID = str(uuid7())


@pytest.fixture
def repo() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def use_case(repo: AsyncMock) -> CreateDatastreamsForDevice:
    return CreateDatastreamsForDevice(datastream_repo=repo)


# --- modelo no SEN66 ---

async def test_non_sen66_raises(use_case: CreateDatastreamsForDevice, repo: AsyncMock) -> None:
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN55")
    with pytest.raises(NotImplementedError):
        await use_case.execute(dto)
    repo.save_batch.assert_not_called()


# --- creación de datastreams ---

async def test_sen66_calls_save_batch_once(use_case: CreateDatastreamsForDevice, repo: AsyncMock) -> None:
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)
    repo.save_batch.assert_called_once()


async def test_sen66_saves_one_datastream_per_variable(use_case: CreateDatastreamsForDevice, repo: AsyncMock) -> None:
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    datastreams = repo.save_batch.call_args[0][0]
    assert len(datastreams) == len(SEN66_CATALOG)


async def test_sen66_datastreams_have_uppercase_codes(use_case: CreateDatastreamsForDevice, repo: AsyncMock) -> None:
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    datastreams = repo.save_batch.call_args[0][0]
    saved_codes = {ds.observed_property_code for ds in datastreams}
    for code in SEN66_CATALOG:
        assert code.upper() in saved_codes


async def test_sen66_datastreams_have_unit_codes(use_case: CreateDatastreamsForDevice, repo: AsyncMock) -> None:
    dto = DeviceRegisteredEventDTO(device_id=_DEVICE_ID, model="SEN66")
    await use_case.execute(dto)

    datastreams = repo.save_batch.call_args[0][0]
    assert all(ds.unit_code for ds in datastreams)
