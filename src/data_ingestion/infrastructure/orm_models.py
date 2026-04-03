from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import ForeignKey, PrimaryKeyConstraint, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.infrastructure.orm_base import Base


class DatastreamModel(Base):
    __tablename__ = "datastreams"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    name: Mapped[str]
    description: Mapped[str | None]
    sensor_id: Mapped[UUID] = mapped_column(ForeignKey("sensors.id"))
    observed_property_id: Mapped[UUID] = mapped_column(ForeignKey("observed_properties.id"))
    unit_id: Mapped[UUID] = mapped_column(ForeignKey("units.id"))
    processing_level_id: Mapped[UUID] = mapped_column(ForeignKey("processing_levels.id"))
    observation_type: Mapped[str] = mapped_column(default="Measurement")
    sampled_medium: Mapped[str | None]
    status: Mapped[str] = mapped_column(default="active")
    phenomenon_time_start: Mapped[datetime | None]
    phenomenon_time_end: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


    observations: Mapped[list[ObservationModel]] = relationship(back_populates="datastream")

    __table_args__ = (
        UniqueConstraint("sensor_id", "observed_property_id", "unit_id", "processing_level_id"),
    )


class ObservationModel(Base):
    __tablename__ = "observations"

    id: Mapped[UUID] = mapped_column(primary_key=False, default=uuid7)
    datastream_id: Mapped[UUID] = mapped_column(ForeignKey("datastreams.id"))
    phenomenon_time: Mapped[datetime]
    result: Mapped[float | None]
    result_time: Mapped[datetime | None]

    __table_args__ = (PrimaryKeyConstraint("id", "phenomenon_time"),)

    datastream: Mapped[DatastreamModel] = relationship(back_populates="observations")


class DatastreamTagModel(Base):
    __tablename__ = "datastream_tags"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    datastream_id: Mapped[UUID] = mapped_column(ForeignKey("datastreams.id", ondelete="CASCADE"))
    key: Mapped[str]
    value: Mapped[str]

    __table_args__ = (UniqueConstraint("datastream_id", "key"),)


class ObservedPropertyModel(Base):
    __tablename__ = "observed_properties"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    definition: Mapped[str | None]
    type: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class UnitModel(Base):
    __tablename__ = "units"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    symbol: Mapped[str]
    type: Mapped[str | None]


class ProcessingLevelModel(Base):
    __tablename__ = "processing_levels"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(unique=True)
    definition: Mapped[str]
    order_index: Mapped[int]


class ResultQualifierModel(Base):
    __tablename__ = "result_qualifiers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    code: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str]


class ObservationQualifierModel(Base):
    __tablename__ = "observation_qualifiers"

    observation_id: Mapped[UUID]
    phenomenon_time: Mapped[datetime]
    qualifier_id: Mapped[UUID] = mapped_column(
        ForeignKey("result_qualifiers.id", ondelete="CASCADE")
    )

    __table_args__ = (PrimaryKeyConstraint("observation_id", "phenomenon_time", "qualifier_id"),)


class SensorModelPropertyModel(Base):
    __tablename__ = "sensor_model_properties"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    model: Mapped[str]
    observed_property_id: Mapped[UUID] = mapped_column(ForeignKey("observed_properties.id"))
    unit_id: Mapped[UUID] = mapped_column(ForeignKey("units.id"))

    __table_args__ = (UniqueConstraint("model", "observed_property_id"),)


class ProcessedMessageModel(Base):
    __tablename__ = "processed_messages"

    message_id: Mapped[UUID] = mapped_column(primary_key=True)
    processed_at: Mapped[datetime] = mapped_column(server_default=func.now())
