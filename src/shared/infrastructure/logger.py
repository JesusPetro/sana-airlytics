from __future__ import annotations

import logging
import logging.config
import os
from pathlib import Path

import structlog
import yaml

_ROOT = Path(__file__).parents[4]


def _load_yaml_config() -> dict:
    path = _ROOT / "config" / "logging.yaml"
    if not path.exists():
        return {}
    with path.open() as f:
        return yaml.safe_load(f) or {}


def _init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration

    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            LoggingIntegration(
                level=logging.ERROR,
                event_level=logging.ERROR,
            ),
        ],
        traces_sample_rate=0.0,
    )


def _configure() -> None:
    config = _load_yaml_config()
    fmt = os.getenv("LOG_FORMAT", config.get("format", "pretty")).lower()
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()

    renderer = (
        structlog.processors.JSONRenderer()
        if fmt == "json"
        else structlog.dev.ConsoleRenderer(colors=True)
    )

    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    if "version" in config:
        for handler_cfg in config.get("handlers", {}).values():
            if "filename" in handler_cfg:
                Path(handler_cfg["filename"]).parent.mkdir(parents=True, exist_ok=True)
        logging.config.dictConfig(config)
    else:
        logging.basicConfig(level=getattr(logging, level_name, logging.INFO))

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=renderer,
        foreign_pre_chain=shared_processors,
    )
    for handler in logging.getLogger().handlers:
        handler.setFormatter(formatter)

    # Campos globales que aparecen en todos los logs
    structlog.contextvars.bind_contextvars(
        app="sana-airlytics",
        environment=os.getenv("ENV", "development"),
    )

    _init_sentry()


_configure()


def get_logger(name: str | None = None):
    """Retorna un logger structlog. Sin nombre retorna el root logger."""
    return structlog.get_logger(name)


def set_logger_level(logger_name: str, level: int) -> None:
    """Cambia dinámicamente el nivel de un logger en runtime."""
    logging.getLogger(logger_name).setLevel(level)


def disable_logger(logger_name: str) -> None:
    """Deshabilita temporalmente un logger."""
    logging.getLogger(logger_name).disabled = True


def enable_logger(logger_name: str) -> None:
    """Habilita un logger previamente deshabilitado."""
    logging.getLogger(logger_name).disabled = False
