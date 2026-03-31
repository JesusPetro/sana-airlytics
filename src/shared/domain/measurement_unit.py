from __future__ import annotations

from enum import Enum


class MeasurementUnit(Enum):
    """
    Parámetros medibles por el sensor Sensirion SEN66.
    Incluye rangos del datasheet para validación en dominio.
    """

    #       label       symbol      min_val  max_val
    PM1  = ("PM1",      "μg/m³",     0.0,     1000.0)
    PM25 = ("PM2.5",    "μg/m³",     0.0,     1000.0)
    PM4  = ("PM4",      "μg/m³",     0.0,     1000.0)
    PM10 = ("PM10",     "μg/m³",     0.0,     1000.0)
    TEMP = ("T",        "°C",       -10.0,    50.0)     # 10 - 40, extremos: -10 y 50 (posible daño)
    RH   = ("RH",       "%",         20.0,    90.0)     # 80.0, en 90.0 es si no hay condensación
    VOC  = ("VOC",      "index",     1.0,     500.0)
    NOX  = ("NOx",      "index",     1.0,     500.0)
    CO2  = ("CO2",      "ppm",       0.0,     40000.0)  # Presición depende del valor

    def __init__(
        self,
        label: str,
        symbol: str,
        min_value: float,
        max_value: float,
    ) -> None:
        self.label = label
        self.symbol = symbol
        self.min_value = min_value
        self.max_value = max_value

    def is_value_in_range(self, value: float) -> bool:
        return self.min_value <= value <= self.max_value

    def __str__(self) -> str:
        return f'{self.label} ({self.symbol})'
