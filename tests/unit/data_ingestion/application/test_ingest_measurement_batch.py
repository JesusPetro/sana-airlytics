from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid7

import pytest

from src.data_ingestion.application.dtos import (
    GpsDTO,
    HardwareMetadataDTO,
    IngestBatchDTO,
    SensorReadingDTO,
    VariableReadingDTO,
)
from src.data_ingestion.application.ingest_measurement_batch import IngestMeasurementBatch
from src.data_ingestion.domain.datastream import Datastream
from src.data_ingestion.domain.result_qualifier import ResultQualifier
from src.shared.domain.device_id import DeviceId

_DEVICE_ID = str(uuid7())
_MESSAGE_ID = str(uuid7())
_NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
_PHENOMENON_TIME = datetime(2026, 1, 1, 11, 59, 0, tzinfo=UTC)


def _var(value: float = 10.0, error: bool = False) -> VariableReadingDTO:
    return VariableReadingDTO(value=value, error=error)


def _reading(gps: GpsDTO | None = None, **overrides) -> SensorReadingDTO:
    defaults = dict(
        timestamp=_PHENOMENON_TIME,
        pm1=_var(), pm2_5=_var(), pm4=_var(), pm10=_var(),
        temperature=_var(30.0), humidity=_var(70.0),
        voc_index=_var(100.0), nox_index=_var(2.0), co2=_var(500.0),
        gps=gps,
    )
    defaults.update(overrides)
    return SensorReadingDTO(**defaults)


def _metadata() -> HardwareMetadataDTO:
    return HardwareMetadataDTO(battery_pct=80, rssi_dbm=-70, uptime_s=3600)


def _dto(readings: list[SensorReadingDTO] | None = None) -> IngestBatchDTO:
    return IngestBatchDTO(
        message_id=_MESSAGE_ID,
        device_id=_DEVICE_ID,
        readings=readings or [_reading()],
        metadata=_metadata(),
    )


def _make_datastream(code: str) -> Datastream:
    return Datastream(
        id=uuid7(),
        device_id=DeviceId(_DEVICE_ID),
        observed_property_code=code,
        unit_code="UG_M3",
    )


def _make_use_case(
    *,
    already_processed: bool = False,
    datastream: Datastream | None = None,
    known_devices: set[UUID] | None = None,
) -> tuple[IngestMeasurementBatch, AsyncMock, AsyncMock, AsyncMock, AsyncMock]:
    obs_repo = AsyncMock()
    processed_repo = AsyncMock()
    datastream_repo = AsyncMock()
    location_updater = AsyncMock()

    processed_repo.exists.return_value = already_processed
    datastream_repo.find_by_device_and_property.return_value = datastream

    if known_devices is None:
        known_devices = {UUID(_DEVICE_ID)}

    use_case = IngestMeasurementBatch(
        observation_repo=obs_repo,
        processed_msg_repo=processed_repo,
        datastream_repo=datastream_repo,
        location_updater=location_updater,
        known_devices=known_devices,
    )
    return use_case, obs_repo, processed_repo, datastream_repo, location_updater


# --- idempotencia ---

@pytest.mark.asyncio
async def test_duplicate_message_is_discarded():
    use_case, obs_repo, processed_repo, _, _ = _make_use_case(already_processed=True)
    await use_case.execute(_dto())
    obs_repo.save_batch.assert_not_called()
    processed_repo.mark_as_processed.assert_not_called()


# --- on-demand device registration ---

@pytest.mark.asyncio
async def test_unknown_device_triggers_datastream_creation():
    ds = _make_datastream("PM1")
    use_case, _, _, datastream_repo, _ = _make_use_case(
        datastream=ds,
        known_devices=set(),
    )

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    datastream_repo.save_batch.assert_called_once()


@pytest.mark.asyncio
async def test_unknown_device_is_added_to_known_devices():
    ds = _make_datastream("PM1")
    known_devices: set[UUID] = set()
    use_case, _, _, _, _ = _make_use_case(datastream=ds, known_devices=known_devices)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    assert UUID(_DEVICE_ID) in known_devices


@pytest.mark.asyncio
async def test_known_device_skips_datastream_creation():
    ds = _make_datastream("PM1")
    use_case, _, _, datastream_repo, _ = _make_use_case(
        datastream=ds,
        known_devices={UUID(_DEVICE_ID)},
    )

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    datastream_repo.save_batch.assert_not_called()


# --- flujo nominal ---

@pytest.mark.asyncio
async def test_creates_one_observation_per_variable():
    ds = _make_datastream("PM1")
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    saved = obs_repo.save_batch.call_args[0][0]
    assert len(saved) == 9


@pytest.mark.asyncio
async def test_observation_always_has_qualifier():
    ds = _make_datastream("PM1")
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    saved = obs_repo.save_batch.call_args[0][0]
    assert all(o.qualifier is not None for o in saved)


@pytest.mark.asyncio
async def test_mark_as_processed_called_after_save():
    ds = _make_datastream("PM1")
    use_case, obs_repo, processed_repo, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    obs_repo.save_batch.assert_called_once()
    processed_repo.mark_as_processed.assert_called_once()


@pytest.mark.asyncio
async def test_multiple_readings_all_persisted():
    ds = _make_datastream("PM1")
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(), _reading()]))

    saved = obs_repo.save_batch.call_args[0][0]
    assert len(saved) == 18


# --- GPS ---

@pytest.mark.asyncio
async def test_reading_with_gps_calls_location_updater():
    ds = _make_datastream("PM1")
    gps = GpsDTO(lat=10.39, lon=-75.47, alt=12.0)
    use_case, _, _, _, location_updater = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(gps=gps)]))

    location_updater.update_location.assert_called_once()


@pytest.mark.asyncio
async def test_reading_without_gps_skips_location_updater():
    ds = _make_datastream("PM1")
    use_case, _, _, _, location_updater = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(gps=None)]))

    location_updater.update_location.assert_not_called()


@pytest.mark.asyncio
async def test_multiple_readings_each_with_gps_calls_location_updater_per_reading():
    ds = _make_datastream("PM1")
    gps = GpsDTO(lat=10.39, lon=-75.47, alt=12.0)
    use_case, _, _, _, location_updater = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(gps=gps), _reading(gps=gps), _reading(gps=None)]))

    assert location_updater.update_location.call_count == 2


# --- error de sensor ---

@pytest.mark.asyncio
async def test_sensor_error_produces_out_of_range_qualifier():
    ds = _make_datastream("PM1")
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(pm2_5=_var(error=True))]))

    saved = obs_repo.save_batch.call_args[0][0]
    out_of_range = [o for o in saved if o.qualifier == ResultQualifier.SENSOR_OUT_OF_RANGE]
    assert len(out_of_range) >= 1
