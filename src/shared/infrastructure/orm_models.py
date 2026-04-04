from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.orm_base import Base


class AnnotationModel(Base):
    __tablename__ = "annotations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True))
    body: Mapped[str] = mapped_column(String)
    created_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
