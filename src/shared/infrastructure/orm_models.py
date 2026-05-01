from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.orm_base import Base


class LocationModel(Base):
    __tablename__ = "locations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    sensor_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("sensors.id"), unique=True
    )
    latitude: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    longitude: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    elevation: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class HistoricalLocationModel(Base):
    __tablename__ = "historical_locations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    sensor_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("sensors.id"))
    latitude: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    longitude: Mapped[float] = mapped_column(DOUBLE_PRECISION)
    elevation: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ObservationModel(Base):
    __tablename__ = "observations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    datastream_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("datastreams.id"))
    phenomenon_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    result: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    result_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    qualifier: Mapped[str | None] = mapped_column(String, nullable=True)


class AnnotationModel(Base):
    __tablename__ = "annotations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True))
    body: Mapped[str] = mapped_column(String)
    created_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
