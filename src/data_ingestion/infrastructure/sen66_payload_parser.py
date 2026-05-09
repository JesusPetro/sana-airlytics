from __future__ import annotations

from datetime import UTC, datetime

from data_ingestion.application.dtos import (
    GpsDTO,
    HardwareMetadataDTO,
    IngestBatchDTO,
    SensorReadingDTO,
    VariableReadingDTO,
)


class SEN66PayloadParser:
    """Convierte un payload MQTT SEN66 a IngestBatchDTO."""

    VARIABLES = (
        "pm1", "pm2_5", "pm4", "pm10",
        "temperature", "humidity", "voc_index", "nox_index", "co2",
    )

    @classmethod
    def parse(cls, payload: dict) -> IngestBatchDTO:
        """Parsea el payload completo. Lanza KeyError/TypeError/ValueError si el formato es inválido."""
        raw_meta = payload["metadata"]
        metadata = HardwareMetadataDTO(
            battery_pct=raw_meta["battery_pct"],
            rssi_dbm=raw_meta["rssi_dbm"],
            uptime_s=raw_meta["uptime_s"],
        )
        readings = [cls._parse_reading(r) for r in payload["readings"]]
        return IngestBatchDTO(
            message_id=payload["message_id"],
            device_id=payload["device_id"],
            readings=readings,
            metadata=metadata,
        )

    @classmethod
    def _parse_reading(cls, raw: dict) -> SensorReadingDTO:
        raw_gps = raw.get("gps")
        gps = (
            GpsDTO(lat=raw_gps["lat"], lon=raw_gps["lon"], alt=raw_gps["alt"])
            if raw_gps is not None
            else None
        )
        return SensorReadingDTO(
            timestamp=datetime.fromisoformat(raw["timestamp"]).replace(tzinfo=UTC),
            gps=gps,
            **{code: VariableReadingDTO(**raw[code]) for code in cls.VARIABLES},
        )
