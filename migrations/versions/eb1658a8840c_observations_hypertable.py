"""observations_hypertable_compression_and_hourly_aggregate

Revision ID: eb1658a8840c
Revises: e96672ff481c
Create Date: 2026-04-30 23:03:02.363027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eb1658a8840c'
down_revision: Union[str, Sequence[str], None] = 'e96672ff481c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Hypertable
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
    op.execute(sa.text(
        "SELECT create_hypertable('observations', 'phenomenon_time', if_not_exists => TRUE)"
    ))

    # Compression
    op.execute(sa.text(
        "ALTER TABLE observations SET ("
        "timescaledb.compress, "
        "timescaledb.compress_orderby = 'phenomenon_time DESC', "
        "timescaledb.compress_segmentby = 'datastream_id'"
        ")"
    ))
    op.execute(sa.text(
        "SELECT add_compression_policy('observations', INTERVAL '2 days')"
    ))

    # Continuous aggregate: hourly avg/min/max per datastream
    op.execute(sa.text("""
        CREATE MATERIALIZED VIEW observations_hourly
        WITH (timescaledb.continuous) AS
        SELECT
            datastream_id,
            time_bucket('1 hour', phenomenon_time) AS bucket,
            AVG(result)                             AS avg_value,
            MIN(result)                             AS min_value,
            MAX(result)                             AS max_value,
            COUNT(*)                                AS sample_count
        FROM observations
        GROUP BY datastream_id, bucket
        WITH NO DATA
    """))
    op.execute(sa.text(
        "SELECT add_continuous_aggregate_policy("
        "  'observations_hourly',"
        "  start_offset => INTERVAL '91 days',"
        "  end_offset   => INTERVAL '1 hour',"
        "  schedule_interval => INTERVAL '1 day'"
        ")"
    ))


def downgrade() -> None:
    op.execute(sa.text(
        "SELECT remove_continuous_aggregate_policy('observations_hourly', if_exists => TRUE)"
    ))
    op.execute(sa.text("DROP MATERIALIZED VIEW IF EXISTS observations_hourly"))
    op.execute(sa.text(
        "SELECT remove_compression_policy('observations', if_exists => TRUE)"
    ))
    op.execute(sa.text(
        "ALTER TABLE observations SET (timescaledb.compress = false)"
    ))
