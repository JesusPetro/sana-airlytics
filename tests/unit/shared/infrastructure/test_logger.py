from __future__ import annotations

import logging
import logging.handlers
from pathlib import Path

import pytest

from src.shared.infrastructure.logger import (
    disable_logger,
    enable_logger,
    get_logger,
    set_logger_level,
)


class TestGetLogger:
    def test_returns_logger_with_expected_methods(self):
        log = get_logger(__name__)
        assert hasattr(log, "info")
        assert hasattr(log, "warning")
        assert hasattr(log, "error")

    def test_different_names_return_different_loggers(self):
        log1 = get_logger("module.a")
        log2 = get_logger("module.b")
        assert log1 is not log2

    def test_logger_can_log_without_error(self):
        log = get_logger(__name__)
        log.info("test_event", key="value")
        log.warning("test_warning", detail="something")
        log.error("test_error", code=42)

    def test_name_is_optional(self):
        log = get_logger()
        assert hasattr(log, "info")
        assert hasattr(log, "warning")
        assert hasattr(log, "error")


class TestFileLogging:
    def test_log_writes_to_file(self, tmp_path: Path):
        log_file = tmp_path / "test.log"
        handler = logging.handlers.RotatingFileHandler(log_file, maxBytes=1_000_000, backupCount=2)
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger = logging.getLogger("file.test.direct")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)

        logger.info("written_to_file")
        handler.flush()

        logger.removeHandler(handler)
        handler.close()

        assert log_file.exists()
        assert log_file.stat().st_size > 0

    def test_log_rotation_creates_backup(self, tmp_path: Path):
        log_file = tmp_path / "rotating.log"
        handler = logging.handlers.RotatingFileHandler(log_file, maxBytes=50, backupCount=2)
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger = logging.getLogger("rotation.test.direct")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)

        for i in range(20):
            logger.info("entry index=%d", i)
        handler.flush()

        logger.removeHandler(handler)
        handler.close()

        log_files = list(tmp_path.glob("rotating.log*"))
        assert len(log_files) > 1


class TestLoggerControls:
    def test_set_logger_level(self):
        set_logger_level("test.module", logging.DEBUG)
        assert logging.getLogger("test.module").level == logging.DEBUG

    def test_disable_and_enable_logger(self):
        disable_logger("test.disable")
        assert logging.getLogger("test.disable").disabled is True

        enable_logger("test.disable")
        assert logging.getLogger("test.disable").disabled is False
