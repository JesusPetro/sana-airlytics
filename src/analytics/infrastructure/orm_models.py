from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.infrastructure.orm_base import Base
from shared.infrastructure.orm_models import UnitModel, WorkspaceModel

alert_metric_enum = Enum("THRESHOLD", "SENSOR_OFFLINE", "BATTERY_LOW", name="alert_metric")
alert_operator_enum = Enum("GT", "LT", "GTE", "LTE", name="alert_operator")


class AlertRuleModel(Base):
    __tablename__ = "alert_rules"
    __table_args__ = (
        CheckConstraint(
            "(metric = 'THRESHOLD' AND operator IS NOT NULL AND threshold IS NOT NULL)"
            " OR (metric != 'THRESHOLD' AND operator IS NULL AND threshold IS NULL)",
            name="chk_threshold_fields",
        ),
        Index("idx_alert_rules_workspace", "workspace_id"),
        Index(
            "idx_alert_rules_unit",
            "unit_id",
            postgresql_where="unit_id IS NOT NULL",
        ),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("workspaces.id")
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("units.id")
    )
    name: Mapped[str] = mapped_column(String)
    metric: Mapped[str] = mapped_column(alert_metric_enum)
    operator: Mapped[str | None] = mapped_column(alert_operator_enum)
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

    workspace: Mapped[WorkspaceModel] = relationship("WorkspaceModel")
    unit: Mapped[UnitModel] = relationship("UnitModel")
    events: Mapped[list[AlertEventModel]] = relationship("AlertEventModel")


class AlertEventModel(Base):
    __tablename__ = "alert_events"
    __table_args__ = (
        Index("idx_alert_events_rule", "alert_rule_id"),
        Index(
            "idx_alert_events_triggered",
            "triggered_at",
            postgresql_ops={"triggered_at": "DESC"},
        ),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    alert_rule_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("alert_rules.id")
    )
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
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
