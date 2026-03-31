import pytest

from shared.domain.measurement_unit import MeasurementUnit


class TestMeasurementUnitAttributes:
    def test_pm1_attributes(self):
        assert MeasurementUnit.PM1.label == "PM1"
        assert MeasurementUnit.PM1.symbol == "μg/m³"
        assert MeasurementUnit.PM1.min_value == 0.0
        assert MeasurementUnit.PM1.max_value == 1000.0

    def test_temp_attributes(self):
        assert MeasurementUnit.TEMP.label == "T"
        assert MeasurementUnit.TEMP.symbol == "°C"
        assert MeasurementUnit.TEMP.min_value == -10.0
        assert MeasurementUnit.TEMP.max_value == 50.0

    def test_co2_attributes(self):
        assert MeasurementUnit.CO2.label == "CO2"
        assert MeasurementUnit.CO2.symbol == "ppm"
        assert MeasurementUnit.CO2.min_value == 0.0
        assert MeasurementUnit.CO2.max_value == 40000.0


class TestIsValueInRange:
    @pytest.mark.parametrize("unit, value", [
        (MeasurementUnit.PM1,  500.0),
        (MeasurementUnit.PM25, 0.0),
        (MeasurementUnit.PM10, 1000.0),
        (MeasurementUnit.TEMP, 25.0),
        (MeasurementUnit.TEMP, -10.0),
        (MeasurementUnit.TEMP, 50.0),
        (MeasurementUnit.RH,   55.0),
        (MeasurementUnit.VOC,  250.0),
        (MeasurementUnit.NOX,  1.0),
        (MeasurementUnit.CO2,  400.0),
    ])
    def test_value_in_range(self, unit, value):
        assert unit.is_value_in_range(value) is True

    @pytest.mark.parametrize("unit, value", [
        (MeasurementUnit.PM1,  -1.0),
        (MeasurementUnit.PM1,  1001.0),
        (MeasurementUnit.TEMP, -11.0),
        (MeasurementUnit.TEMP, 51.0),
        (MeasurementUnit.RH,   19.9),
        (MeasurementUnit.RH,   90.1),
        (MeasurementUnit.VOC,  0.9),
        (MeasurementUnit.VOC,  500.1),
        (MeasurementUnit.CO2,  -1.0),
        (MeasurementUnit.CO2,  40001.0),
    ])
    def test_value_out_of_range(self, unit, value):
        assert unit.is_value_in_range(value) is False


class TestStr:
    @pytest.mark.parametrize("unit, expected", [
        (MeasurementUnit.PM1,  "PM1 (μg/m³)"),
        (MeasurementUnit.PM25, "PM2.5 (μg/m³)"),
        (MeasurementUnit.TEMP, "T (°C)"),
        (MeasurementUnit.RH,   "RH (%)"),
        (MeasurementUnit.VOC,  "VOC (index)"),
        (MeasurementUnit.NOX,  "NOx (index)"),
        (MeasurementUnit.CO2,  "CO2 (ppm)"),
    ])
    def test_str(self, unit, expected):
        assert str(unit) == expected
