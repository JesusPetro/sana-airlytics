from data_ingestion.infrastructure.orm_models import (
    ObservedPropertyModel,
    UnitModel,
)


def test_create_observed_property(session):
    prop = ObservedPropertyModel(code="TEST_PROP", name="Test Property")
    session.add(prop)
    session.flush()

    result = session.get(ObservedPropertyModel, prop.id)
    assert result.code == "TEST_PROP"
    assert result.name == "Test Property"


def test_observed_property_code_unique(session):
    import pytest
    from sqlalchemy.exc import IntegrityError

    session.add(ObservedPropertyModel(code="TEST_UNIQUE", name="Test Unique"))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(ObservedPropertyModel(code="TEST_UNIQUE", name="Duplicate"))
            session.flush()


def test_create_unit(session):
    unit = UnitModel(code="TEST_UNIT", name="Test Unit", symbol="tu")
    session.add(unit)
    session.flush()

    result = session.get(UnitModel, unit.id)
    assert result.symbol == "tu"
