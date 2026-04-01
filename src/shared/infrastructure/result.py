from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Never


@dataclass(frozen=True)
class Ok[T]:
    value: T

    def is_ok(self) -> bool:
        return True

    def is_err(self) -> bool:
        return False

    def unwrap(self) -> T:
        return self.value

    def unwrap_or(self, default: T) -> T:
        return self.value

    def map[U](self, fn: Callable[[T], U]) -> Ok[U]:
        return Ok(fn(self.value))


@dataclass(frozen=True)
class Err[E: Exception]:
    error: E

    def is_ok(self) -> bool:
        return False

    def is_err(self) -> bool:
        return True

    def unwrap(self) -> Never:
        raise self.error

    def unwrap_or[T](self, default: T) -> T:
        return default

    def map[U](self, fn: Callable) -> Err[E]:
        return self


type Result[T, E: Exception] = Ok[T] | Err[E]
