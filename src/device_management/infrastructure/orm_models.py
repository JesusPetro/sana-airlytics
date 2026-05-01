from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import DateTime, ForeignKey, Integer, String, func, text
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.orm_base import Base
from shared.infrastructure.orm_models import HistoricalLocationModel, LocationModel  # noqa: F401


class SensorModel(Base):
    __tablename__ = "sensors"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    site_type: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    deactivated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sampling_interval_seconds: Mapped[int] = mapped_column(Integer, server_default=text("60"))
    transmission_interval_seconds: Mapped[int] = mapped_column(Integer, server_default=text("300"))
    workspace_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))



