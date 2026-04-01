from __future__ import annotations

import pytest

from src.shared.infrastructure.result import Err, Ok


class TestOk:
    def test_is_ok(self):
        assert Ok(42).is_ok() is True

    def test_is_err(self):
        assert Ok(42).is_err() is False

    def test_unwrap_returns_value(self):
        assert Ok("hello").unwrap() == "hello"

    def test_unwrap_or_returns_value_ignoring_default(self):
        assert Ok(42).unwrap_or(0) == 42

    def test_map_transforms_value(self):
        result = Ok(3).map(lambda x: x * 2)
        assert isinstance(result, Ok)
        assert result.unwrap() == 6

    def test_map_changes_type(self):
        result = Ok("abc").map(len)
        assert result.unwrap() == 3

    def test_equality(self):
        assert Ok(42) == Ok(42)

    def test_inequality(self):
        assert Ok(1) != Ok(2)


class TestErr:
    def test_is_ok(self):
        assert Err(ValueError("bad")).is_ok() is False

    def test_is_err(self):
        assert Err(ValueError("bad")).is_err() is True

    def test_unwrap_raises_original_exception(self):
        error = ValueError("something failed")
        with pytest.raises(ValueError, match="something failed"):
            Err(error).unwrap()

    def test_unwrap_or_returns_default(self):
        assert Err(ValueError("x")).unwrap_or(99) == 99

    def test_unwrap_or_returns_none_default(self):
        assert Err(ValueError("x")).unwrap_or(None) is None

    def test_map_returns_same_err(self):
        err = Err(ValueError("x"))
        result = err.map(lambda x: x * 2)
        assert isinstance(result, Err)
        assert result is err

    def test_equality(self):
        e = ValueError("x")
        assert Err(e) == Err(e)


class TestResultPattern:
    def test_ok_branch_in_conditional(self):
        result = Ok(10)
        if result.is_ok():
            value = result.unwrap()
        else:
            value = result.unwrap_or(0)
        assert value == 10

    def test_err_branch_in_conditional(self):
        result = Err(ValueError("oops"))
        if result.is_ok():
            value = result.unwrap()
        else:
            value = result.unwrap_or(-1)
        assert value == -1

    def test_chained_map_on_ok(self):
        result = Ok(2).map(lambda x: x + 1).map(lambda x: x * 10)
        assert result.unwrap() == 30

    def test_chained_map_on_err_stays_err(self):
        result = Err(ValueError("x")).map(lambda x: x + 1).map(lambda x: x * 10)
        assert result.is_err()
