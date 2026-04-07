from __future__ import annotations

from dataclasses import dataclass

from shared.domain.observed_property import ObservedProperty


@dataclass(frozen=True)
class Sen66Limits:
    observed_property: (
        ObservedProperty  # tiene hard_min y max del datasheet (de los sensores individuales).
    )
    soft_min: float  # plausibilidad Cartagena
    soft_max: float
    sentinel_values: frozenset[float]  # 0xFFFF/0x7FFF decodificados


SEN66_CATALOG: dict[str, Sen66Limits] = {
    "pm1": Sen66Limits(
        ObservedProperty.PM1, soft_min=0.0, soft_max=500.0, sentinel_values=frozenset({6553.5})
    ),
    "pm2_5": Sen66Limits(
        ObservedProperty.PM2_5, soft_min=0.0, soft_max=500.0, sentinel_values=frozenset({6553.5})
    ),
    "pm4": Sen66Limits(
        ObservedProperty.PM4, soft_min=0.0, soft_max=500.0, sentinel_values=frozenset({6553.5})
    ),
    "pm10": Sen66Limits(
        ObservedProperty.PM10, soft_min=0.0, soft_max=500.0, sentinel_values=frozenset({6553.5})
    ),
    "temperature": Sen66Limits(
        ObservedProperty.TEMPERATURE,
        soft_min=10.0,
        soft_max=45.0,
        sentinel_values=frozenset({163.835}),
    ),
    "humidity": Sen66Limits(
        ObservedProperty.HUMIDITY, soft_min=30.0, soft_max=85.0, sentinel_values=frozenset({3276.7})
    ),
    "voc_index": Sen66Limits(
        ObservedProperty.VOC_INDEX, soft_min=1.0, soft_max=400.0, sentinel_values=frozenset()
    ),
    "nox_index": Sen66Limits(
        ObservedProperty.NOX_INDEX, soft_min=1.0, soft_max=400.0, sentinel_values=frozenset()
    ),
    "co2": Sen66Limits(
        ObservedProperty.CO2, soft_min=350.0, soft_max=5000.0, sentinel_values=frozenset({65535.0})
    ),
}
