from __future__ import annotations

from .result_qualifier import ResultQualifier
from .sen66_catalog import SEN66_CATALOG
from .sensor_reading import SensorReading


class MeasurementValidator:
    def validate(self, reading: SensorReading) -> ResultQualifier:
        limits = SEN66_CATALOG.get(reading.variable_code)
        if limits is None:
            return ResultQualifier.VALID

        # Paso 1 - error firmware o centinela
        if reading.has_error or reading.value in limits.sentinel_values:
            return ResultQualifier.SENSOR_OUT_OF_RANGE

        # Paso 2 - limite duro (datasheet)
        prop = limits.observed_property
        if not (prop.min_value <= reading.value <= prop.max_value):
            return ResultQualifier.SENSOR_OUT_OF_RANGE

        # Paso 3 - limite blando (Cartagena)
        if not (limits.soft_min <= reading.value <= limits.soft_max):
            return ResultQualifier.SUSPICIOUS_VALUE

        # Paso 4
        return ResultQualifier.VALID
