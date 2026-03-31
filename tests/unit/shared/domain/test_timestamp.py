from datetime import UTC, datetime, timedelta, timezone

import pytest

from src.shared.domain.timestamp import Timestamp


class TestTimestampValidation:
    def test_aware_datetime_accepted(self):
        ts = Timestamp(datetime.now(UTC))
        assert ts.value.tzinfo is not None

    def test_naive_datetime_raises(self):
        with pytest.raises(ValueError, match="Timestamp must be timezone-aware"):
            Timestamp(datetime(2024, 1, 1, 12, 0, 0))

    def test_non_utc_timezone_accepted(self):
        tz = timezone(timedelta(hours=5))
        ts = Timestamp(datetime.now(tz))
        assert ts.value.tzinfo is not None


class TestTimestampNow:
    def test_now_returns_timestamp(self):
        ts = Timestamp.now()
        assert isinstance(ts, Timestamp)

    def test_now_is_utc(self):
        ts = Timestamp.now()
        assert ts.value.tzinfo == UTC

    def test_now_is_recent(self):
        before = datetime.now(UTC)
        ts = Timestamp.now()
        after = datetime.now(UTC)
        assert before <= ts.value <= after


class TestTimestampFromIso:
    def test_valid_iso_with_tz(self):
        ts = Timestamp.from_iso("2024-06-15T10:30:00+00:00")
        assert ts.value.year == 2024

    def test_iso_without_tz_raises(self):
        with pytest.raises(ValueError, match="Timestamp must be timezone-aware"):
            Timestamp.from_iso("2024-06-15T10:30:00")


class TestTimestampIsBefore:
    def test_earlier_is_before_later(self):
        earlier = Timestamp(datetime(2024, 1, 1, tzinfo=UTC))
        later = Timestamp(datetime(2024, 6, 1, tzinfo=UTC))
        assert earlier.is_before(later) is True

    def test_later_is_not_before_earlier(self):
        earlier = Timestamp(datetime(2024, 1, 1, tzinfo=UTC))
        later = Timestamp(datetime(2024, 6, 1, tzinfo=UTC))
        assert later.is_before(earlier) is False

    def test_equal_timestamps_not_before(self):
        ts = Timestamp(datetime(2024, 1, 1, tzinfo=UTC))
        assert ts.is_before(ts) is False


class TestTimestampIsInFuture:
    def test_future_timestamp_is_in_future(self):
        future = Timestamp(datetime.now(UTC) + timedelta(hours=1))
        assert future.is_in_future() is True

    def test_past_timestamp_is_not_in_future(self):
        past = Timestamp(datetime(2000, 1, 1, tzinfo=UTC))
        assert past.is_in_future() is False
