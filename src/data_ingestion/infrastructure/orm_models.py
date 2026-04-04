from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.infrastructure.orm_base import Base


class DatastreamModel(Base):
    __tablename__ = "datastreams"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)
    sensor_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("sensors.id"))
    observed_property_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("observed_properties.id")
    )
    unit_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("units.id"))
    processing_level_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("processing_levels.id")
    )
    observation_type: Mapped[str] = mapped_column(String, default="Measurement")
    sampled_medium: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active")
    phenomenon_time_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    phenomenon_time_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    observations: Mapped[list[ObservationModel]] = relationship(back_populates="datastream")

    __table_args__ = (
        UniqueConstraint(
            "sensor_id", "observed_property_id", "unit_id", "processing_level_id",
            name="uq_datastreams_sensor_property_unit_level",
        ),
    )


class ObservationModel(Base):
    __tablename__ = "observations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=False, default=uuid7)
    datastream_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("datastreams.id"))
    phenomenon_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    result: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    result_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (PrimaryKeyConstraint("id", "phenomenon_time"),)

    datastream: Mapped[DatastreamModel] = relationship(back_populates="observations")


class DatastreamTagModel(Base):
    __tablename__ = "datastream_tags"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    datastream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("datastreams.id", ondelete="CASCADE")
    )
    key: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)

    __table_args__ = (
        UniqueConstraint("datastream_id", "key", name="uq_datastream_tags_stream_key"),
    )


class ObservedPropertyModel(Base):
    __tablename__ = "observed_properties"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    definition: Mapped[str | None] = mapped_column(String)
    type: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UnitModel(Base):
    __tablename__ = "units"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    symbol: Mapped[str] = mapped_column(String)
    type: Mapped[str | None] = mapped_column(String)


class ProcessingLevelModel(Base):
    __tablename__ = "processing_levels"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(String, unique=True)
    definition: Mapped[str] = mapped_column(String)
    order_index: Mapped[int] = mapped_column(Integer)


class ResultQualifierModel(Base):
    __tablename__ = "result_qualifiers"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(String, unique=True)
    description: Mapped[str] = mapped_column(String)


class ObservationQualifierModel(Base):
    __tablename__ = "observation_qualifiers"

    observation_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True))
    phenomenon_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    qualifier_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("result_qualifiers.id", ondelete="CASCADE")
    )

    __table_args__ = (PrimaryKeyConstraint("observation_id", "phenomenon_time", "qualifier_id"),)


class SensorModelPropertyModel(Base):
    __tablename__ = "sensor_model_properties"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid7)
    model: Mapped[str] = mapped_column(String)
    observed_property_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("observed_properties.id")
    )
    unit_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("units.id"))

    __table_args__ = (
        UniqueConstraint(
            "model", "observed_property_id", name="uq_sensor_model_props_model_property"
        ),
    )


class ProcessedMessageModel(Base):
    __tablename__ = "processed_messages"

    message_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
