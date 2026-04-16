from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid7

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
from src.data_ingestion.domain.processing_level import ProcessingLevel
from src.data_ingestion.domain.result_qualifier import ResultQualifier
from src.shared.domain.device_id import DeviceId

_DEVICE_ID = str(uuid7())
_MESSAGE_ID = str(uuid7())
_NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
_PHENOMENON_TIME = datetime(2026, 1, 1, 11, 59, 0, tzinfo=UTC)


def _var(value: float = 10.0, error: bool = False) -> VariableReadingDTO:
    return VariableReadingDTO(value=value, error=error)


def _reading(**overrides) -> SensorReadingDTO:
    defaults = dict(
        timestamp=_PHENOMENON_TIME,
        pm1=_var(), pm2_5=_var(), pm4=_var(), pm10=_var(),
        temperature=_var(30.0), humidity=_var(70.0),
        voc_index=_var(100.0), nox_index=_var(2.0), co2=_var(500.0),
    )
    defaults.update(overrides)
    return SensorReadingDTO(**defaults)


def _metadata(gps: GpsDTO | None = None) -> HardwareMetadataDTO:
    return HardwareMetadataDTO(battery_pct=80, rssi_dbm=-70, uptime_s=3600, gps=gps)


def _dto(readings: list[SensorReadingDTO] | None = None, gps: GpsDTO | None = None) -> IngestBatchDTO:
    return IngestBatchDTO(
        message_id=_MESSAGE_ID,
        device_id=_DEVICE_ID,
        readings=readings or [_reading()],
        metadata=_metadata(gps=gps),
    )


def _make_datastream(code: str, level: ProcessingLevel) -> Datastream:
    return Datastream(
        id=uuid7(),
        device_id=DeviceId(_DEVICE_ID),
        observed_property_code=code,
        processing_level=level,
    )


def _make_use_case(
    *,
    already_processed: bool = False,
    datastream: Datastream | None = None,
) -> tuple[IngestMeasurementBatch, AsyncMock, AsyncMock, AsyncMock, AsyncMock]:
    obs_repo = AsyncMock()
    processed_repo = AsyncMock()
    datastream_repo = AsyncMock()
    location_updater = AsyncMock()

    processed_repo.exists.return_value = already_processed
    datastream_repo.find_by_device_and_property.return_value = datastream

    use_case = IngestMeasurementBatch(
        observation_repo=obs_repo,
        processed_msg_repo=processed_repo,
        datastream_repo=datastream_repo,
        location_updater=location_updater,
    )
    return use_case, obs_repo, processed_repo, datastream_repo, location_updater


# --- idempotencia ---

@pytest.mark.asyncio
async def test_duplicate_message_is_discarded():
    use_case, obs_repo, processed_repo, _, _ = _make_use_case(already_processed=True)
    await use_case.execute(_dto())
    obs_repo.save_batch.assert_not_called()
    processed_repo.mark_as_processed.assert_not_called()


# --- sin datastreams ---

@pytest.mark.asyncio
async def test_no_datastreams_skips_persistence():
    use_case, obs_repo, processed_repo, _, _ = _make_use_case(datastream=None)
    await use_case.execute(_dto())
    obs_repo.save_batch.assert_not_called()
    processed_repo.mark_as_processed.assert_not_called()


# --- flujo nominal ---

@pytest.mark.asyncio
async def test_creates_l0_and_l1_per_variable():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    saved = obs_repo.save_batch.call_args[0][0]
    levels = [obs.processing_level for obs in saved]
    assert ProcessingLevel.L0 in levels
    assert ProcessingLevel.L1 in levels


@pytest.mark.asyncio
async def test_l0_has_no_qualifier():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    saved = obs_repo.save_batch.call_args[0][0]
    l0_obs = [o for o in saved if o.processing_level == ProcessingLevel.L0]
    assert all(o.qualifier is None for o in l0_obs)


@pytest.mark.asyncio
async def test_l1_has_qualifier():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    saved = obs_repo.save_batch.call_args[0][0]
    l1_obs = [o for o in saved if o.processing_level == ProcessingLevel.L1]
    assert all(o.qualifier is not None for o in l1_obs)


@pytest.mark.asyncio
async def test_mark_as_processed_called_after_save():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, obs_repo, processed_repo, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto())

    obs_repo.save_batch.assert_called_once()
    processed_repo.mark_as_processed.assert_called_once()


@pytest.mark.asyncio
async def test_multiple_readings_all_persisted():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(), _reading()]))

    saved = obs_repo.save_batch.call_args[0][0]
    # 2 lecturas × 9 variables × 2 niveles = 36 observaciones
    assert len(saved) == 36


# --- GPS ---

@pytest.mark.asyncio
async def test_gps_present_calls_location_updater():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    gps = GpsDTO(lat=10.39, lon=-75.47, alt=12.0)
    use_case, _, _, _, location_updater = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(gps=gps))

    location_updater.update_location.assert_called_once()


@pytest.mark.asyncio
async def test_no_gps_skips_location_updater():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, _, _, _, location_updater = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(gps=None))

    location_updater.update_location.assert_not_called()


# --- error de sensor ---

@pytest.mark.asyncio
async def test_sensor_error_produces_out_of_range_qualifier():
    ds = _make_datastream("PM1", ProcessingLevel.L0)
    use_case, obs_repo, _, _, _ = _make_use_case(datastream=ds)

    with patch("src.data_ingestion.application.ingest_measurement_batch.datetime") as mock_dt:
        mock_dt.now.return_value = _NOW
        mock_dt.UTC = UTC
        await use_case.execute(_dto(readings=[_reading(pm2_5=_var(error=True))]))

    saved = obs_repo.save_batch.call_args[0][0]
    l1_pm25 = [
        o for o in saved
        if o.processing_level == ProcessingLevel.L1
        and o.phenomenon_time == _PHENOMENON_TIME
    ]
    out_of_range = [o for o in l1_pm25 if o.qualifier == ResultQualifier.SENSOR_OUT_OF_RANGE]
    assert len(out_of_range) >= 1
