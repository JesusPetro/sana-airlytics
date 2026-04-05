import pytest

from shared.domain.observed_property import ObservedProperty


class TestObservedPropertyAttributes:
    def test_pm1_attributes(self):
        p = ObservedProperty.PM1
        assert p.label == "PM1"
        assert p.symbol == "µg/m³"
        assert p.unit_code == "UG_M3"
        assert p.property_type == "atmospheric"
        assert p.min_value == 0.0
        assert p.max_value == 1000.0

    def test_temperature_attributes(self):
        p = ObservedProperty.TEMPERATURE
        assert p.label == "T"
        assert p.symbol == "°C"
        assert p.unit_code == "DEG_C"
        assert p.property_type == "meteorological"
        assert p.min_value == -10.0
        assert p.max_value == 50.0

    def test_humidity_attributes(self):
        p = ObservedProperty.HUMIDITY
        assert p.unit_code == "PCT_RH"
        assert p.property_type == "meteorological"
        assert p.min_value == 0.0
        assert p.max_value == 90.0

    def test_voc_index_attributes(self):
        p = ObservedProperty.VOC_INDEX
        assert p.unit_code == "IDX"
        assert p.property_type == "index"
        assert p.min_value == 1.0
        assert p.max_value == 500.0

    def test_co2_attributes(self):
        p = ObservedProperty.CO2
        assert p.label == "CO2"
        assert p.symbol == "ppm"
        assert p.unit_code == "PPM"
        assert p.property_type == "atmospheric"
        assert p.min_value == 0.0
        assert p.max_value == 40000.0


class TestIsValueInRange:
    @pytest.mark.parametrize("prop, value", [
        (ObservedProperty.PM1,         500.0),
        (ObservedProperty.PM2_5,       0.0),
        (ObservedProperty.PM10,        1000.0),
        (ObservedProperty.TEMPERATURE, 25.0),
        (ObservedProperty.TEMPERATURE, -10.0),
        (ObservedProperty.TEMPERATURE, 50.0),
        (ObservedProperty.HUMIDITY,    55.0),
        (ObservedProperty.HUMIDITY,    0.0),
        (ObservedProperty.HUMIDITY,    90.0),
        (ObservedProperty.VOC_INDEX,   250.0),
        (ObservedProperty.NOX_INDEX,   1.0),
        (ObservedProperty.CO2,         400.0),
        (ObservedProperty.CO2,         0.0),
    ])
    def test_value_in_range(self, prop, value):
        assert prop.is_value_in_range(value) is True

    @pytest.mark.parametrize("prop, value", [
        (ObservedProperty.PM1,         -1.0),
        (ObservedProperty.PM1,         1001.0),
        (ObservedProperty.TEMPERATURE, -11.0),
        (ObservedProperty.TEMPERATURE, 51.0),
        (ObservedProperty.HUMIDITY,    -0.1),
        (ObservedProperty.HUMIDITY,    90.1),
        (ObservedProperty.VOC_INDEX,   0.9),
        (ObservedProperty.VOC_INDEX,   500.1),
        (ObservedProperty.CO2,         -1.0),
        (ObservedProperty.CO2,         40001.0),
    ])
    def test_value_out_of_range(self, prop, value):
        assert prop.is_value_in_range(value) is False


class TestStr:
    @pytest.mark.parametrize("prop, expected", [
        (ObservedProperty.PM1,         "PM1 (µg/m³)"),
        (ObservedProperty.PM2_5,       "PM2.5 (µg/m³)"),
        (ObservedProperty.TEMPERATURE, "T (°C)"),
        (ObservedProperty.HUMIDITY,    "RH (%RH)"),
        (ObservedProperty.VOC_INDEX,   "VOC (idx)"),
        (ObservedProperty.NOX_INDEX,   "NOx (idx)"),
        (ObservedProperty.CO2,         "CO2 (ppm)"),
    ])
    def test_str(self, prop, expected):
        assert str(prop) == expected


class TestAllPropertiesCovered:
    def test_nine_properties_defined(self):
        assert len(ObservedProperty) == 9

    def test_all_codes_unique(self):
        codes = [p.name for p in ObservedProperty]
        assert len(codes) == len(set(codes))

    def test_all_unit_codes_defined(self):
        for prop in ObservedProperty:
            assert prop.unit_code, f"{prop.name} missing unit_code"

    def test_all_property_types_valid(self):
        valid_types = {"atmospheric", "meteorological", "index"}
        for prop in ObservedProperty:
            assert prop.property_type in valid_types, f"{prop.name} has invalid property_type"
