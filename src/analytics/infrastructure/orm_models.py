"""
### `analytics/infrastructure/orm_models.py`
- [ ] `event`
"""



from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.orm_base import Base


class EventModel(Base):
    __tablename__ = "events"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    name: Mapped[str] = mapped_column(String)
    condition: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("workspaces.id")
    )
    sensor_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("sensors.id"))
    datastream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("datastreams.id")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )



