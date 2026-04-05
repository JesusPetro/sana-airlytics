from __future__ import annotations

from enum import Enum


class ObservedProperty(Enum):
    """
    Variables ambientales medibles por el sensor Sensirion SEN66.
    Incluye metadatos de unidad, tipo y límites duros del datasheet
    para validación en dominio.

    Límites duros fuente: datasheet SEN66 v0.92 (diciembre 2025):
      PM:       Tabla 2 (Mass concentration specified range)
      T/RH:     Tabla 9 (absolute min/max operating)
      VOC/NOx:  Tabla 4 (Output signals)
      CO2:      Tabla 5 (CO2 Specifications)
    """

    #             label        symbol   unit_code   property_type     min      max
    PM1       = ("PM1",       "µg/m³", "UG_M3",   "atmospheric",     0.0,   1000.0)
    PM2_5     = ("PM2.5",     "µg/m³", "UG_M3",   "atmospheric",     0.0,   1000.0)
    PM4       = ("PM4",       "µg/m³", "UG_M3",   "atmospheric",     0.0,   1000.0)
    PM10      = ("PM10",      "µg/m³", "UG_M3",   "atmospheric",     0.0,   1000.0)
    TEMPERATURE = ("T",       "°C",    "DEG_C",   "meteorological", -10.0,    50.0)
    HUMIDITY  = ("RH",        "%RH",   "PCT_RH",  "meteorological",   0.0,    90.0)
    VOC_INDEX = ("VOC",       "idx",   "IDX",     "index",            1.0,   500.0)
    NOX_INDEX = ("NOx",       "idx",   "IDX",     "index",            1.0,   500.0)
    CO2       = ("CO2",       "ppm",   "PPM",     "atmospheric",      0.0, 40000.0)

    def __init__(
        self,
        label: str,
        symbol: str,
        unit_code: str,
        property_type: str,
        min_value: float,
        max_value: float,
    ) -> None:
        self.label = label
        self.symbol = symbol
        self.unit_code = unit_code
        self.property_type = property_type
        self.min_value = min_value
        self.max_value = max_value

    def is_value_in_range(self, value: float) -> bool:
        return self.min_value <= value <= self.max_value

    def __str__(self) -> str:
        return f"{self.label} ({self.symbol})"
