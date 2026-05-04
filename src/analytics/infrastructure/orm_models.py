from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.orm_base import Base


class AlertRuleModel(Base):
    """Modelo ORM para la tabla alert_rules."""

    __tablename__ = "alert_rules"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("workspaces.id")
    )
    datastream_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("datastreams.id")
    )
    name: Mapped[str] = mapped_column(String)
    metric: Mapped[str] = mapped_column(String)
    operator: Mapped[str | None] = mapped_column(String)
    threshold: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AlertEventModel(Base):
    """Modelo ORM para la tabla alert_events."""

    __tablename__ = "alert_events"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    alert_rule_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("alert_rules.id")
    )
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    value: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    message: Mapped[str] = mapped_column(String)


class ZoneModel(Base):
    """
    Modelo ORM para la tabla zones.
    La columna geom (PostGIS) se agrega en una migracion futura
    sin necesidad de modificar este modelo — se mapea como columna adicional.
    """

    __tablename__ = "zones"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("workspaces.id")
    )
    name: Mapped[str] = mapped_column(String)
    center_lat: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    center_lon: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    radius_m: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    created_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
