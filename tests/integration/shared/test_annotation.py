from uuid import uuid7

from sqlalchemy.ext.asyncio import AsyncSession

from access_control.infrastructure.orm_models import UserModel
from shared.infrastructure.orm_models import AnnotationModel


async def test_create_annotation(session: AsyncSession):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    await session.flush()

    annotation = AnnotationModel(
        entity_type="sensor",
        entity_id=uuid7(),
        body="Sensor recalibrado manualmente",
        created_by=user.id,
    )
    session.add(annotation)
    await session.flush()

    result = await session.get(AnnotationModel, annotation.id)
    assert result.entity_type == "sensor"
    assert result.body == "Sensor recalibrado manualmente"
    assert result.created_by == user.id
