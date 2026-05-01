import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.infrastructure.orm_models import (
    ObservedPropertyModel,
    UnitModel,
)


async def test_create_observed_property(session: AsyncSession):
    prop = ObservedPropertyModel(code="TEST_PROP", name="Test Property")
    session.add(prop)
    await session.flush()

    result = await session.get(ObservedPropertyModel, prop.id)
    assert result.code == "TEST_PROP"
    assert result.name == "Test Property"


async def test_observed_property_code_unique(session: AsyncSession):
    session.add(ObservedPropertyModel(code="TEST_UNIQUE", name="Test Unique"))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(ObservedPropertyModel(code="TEST_UNIQUE", name="Duplicate"))
            await session.flush()


async def test_create_unit(session: AsyncSession):
    unit = UnitModel(code="TEST_UNIT", name="Test Unit", symbol="tu")
    session.add(unit)
    await session.flush()

    result = await session.get(UnitModel, unit.id)
    assert result.symbol == "tu"
