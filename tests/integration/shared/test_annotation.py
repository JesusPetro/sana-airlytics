from uuid import uuid7

from access_control.infrastructure.orm_models import UserModel
from shared.infrastructure.orm_models import AnnotationModel


def test_create_annotation(session):
    user = UserModel(
        first_name="Jesus", last_name="Petro",
        email="jesus@sana.com", password_hash="hash",
    )
    session.add(user)
    session.flush()

    annotation = AnnotationModel(
        entity_type="sensor",
        entity_id=uuid7(),
        body="Sensor recalibrado manualmente",
        created_by=user.id,
    )
    session.add(annotation)
    session.flush()

    result = session.get(AnnotationModel, annotation.id)
    assert result.entity_type == "sensor"
    assert result.body == "Sensor recalibrado manualmente"
    assert result.created_by == user.id
