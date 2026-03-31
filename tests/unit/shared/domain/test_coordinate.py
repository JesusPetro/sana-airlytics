import pytest

from src.shared.domain.coordinate import Coordinate


class TestCoordinateValidation:
    def test_valid_coordinate_accepted(self):
        coord = Coordinate(latitude=10.0, longitude=20.0)
        assert coord.latitude == 10.0
        assert coord.longitude == 20.0

    @pytest.mark.parametrize("lat", [-90.0, 0.0, 90.0])
    def test_latitude_boundary_values_accepted(self, lat):
        Coordinate(latitude=lat, longitude=0.0)

    @pytest.mark.parametrize("lon", [-180.0, 0.0, 180.0])
    def test_longitude_boundary_values_accepted(self, lon):
        Coordinate(latitude=0.0, longitude=lon)

    @pytest.mark.parametrize("lat", [-90.1, 91.0, 180.0])
    def test_invalid_latitude_raises(self, lat):
        with pytest.raises(ValueError, match="Latitude"):
            Coordinate(latitude=lat, longitude=0.0)

    @pytest.mark.parametrize("lon", [-180.1, 181.0, 360.0])
    def test_invalid_longitude_raises(self, lon):
        with pytest.raises(ValueError, match="Longitude"):
            Coordinate(latitude=0.0, longitude=lon)


class TestCoordinateEquality:
    def test_same_values_are_equal(self):
        assert Coordinate(1.0, 2.0) == Coordinate(1.0, 2.0)

    def test_different_values_are_not_equal(self):
        assert Coordinate(1.0, 2.0) != Coordinate(3.0, 4.0)
