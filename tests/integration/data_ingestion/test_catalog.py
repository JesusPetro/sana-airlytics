from data_ingestion.infrastructure.orm_models import (
    ObservedPropertyModel,
    ResultQualifierModel,
    UnitModel,
)


def test_create_observed_property(session):
    prop = ObservedPropertyModel(code="PM2_5", name="PM2.5")
    session.add(prop)
    session.flush()

    result = session.get(ObservedPropertyModel, prop.id)
    assert result.code == "PM2_5"
    assert result.name == "PM2.5"


def test_observed_property_code_unique(session):
    import pytest
    from sqlalchemy.exc import IntegrityError

    session.add(ObservedPropertyModel(code="CO2", name="Carbon Dioxide"))
    session.flush()

    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(ObservedPropertyModel(code="CO2", name="Duplicate"))
            session.flush()


def test_create_unit(session):
    unit = UnitModel(code="UG_M3", name="Micrograms per cubic meter", symbol="µg/m³")
    session.add(unit)
    session.flush()

    result = session.get(UnitModel, unit.id)
    assert result.symbol == "µg/m³"


def test_create_result_qualifier(session):
    qualifier = ResultQualifierModel(code="LOW_BATTERY", description="Sensor with low battery")
    session.add(qualifier)
    session.flush()

    result = session.get(ResultQualifierModel, qualifier.id)
    assert result.code == "LOW_BATTERY"
