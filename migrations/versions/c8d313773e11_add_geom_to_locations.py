"""add_geom_to_locations

Revision ID: c8d313773e11
Revises: 8b40024ee49f
Create Date: 2026-05-04 21:05:39.735451

"""
from typing import Sequence, Union

import geoalchemy2
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d313773e11'
down_revision: Union[str, Sequence[str], None] = '8b40024ee49f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix index on alert_events (autogenerate detected expression drift)
    op.execute("DROP INDEX IF EXISTS idx_alert_events_triggered")
    op.execute("CREATE INDEX IF NOT EXISTS idx_alert_events_triggered ON alert_events (triggered_at DESC)")

    # locations: add geom column, backfill from existing lat/lon, add GIST index and trigger
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS geom geometry(POINT,4326)")
    op.execute("""
        UPDATE locations
        SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
        WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING gist (geom)")
    op.execute("""
        CREATE OR REPLACE FUNCTION sync_location_geom()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
                NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("DROP TRIGGER IF EXISTS trg_sync_location_geom ON locations")
    op.execute("""
        CREATE TRIGGER trg_sync_location_geom
        BEFORE INSERT OR UPDATE OF latitude, longitude
        ON locations
        FOR EACH ROW EXECUTE FUNCTION sync_location_geom()
    """)

    # historical_locations: same pattern plus composite index for temporal+spatial queries
    op.execute("ALTER TABLE historical_locations ADD COLUMN IF NOT EXISTS geom geometry(POINT,4326)")
    op.execute("""
        UPDATE historical_locations
        SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
        WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_historical_locations_geom ON historical_locations USING gist (geom)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_historical_locations_sensor_time ON historical_locations (sensor_id, recorded_at DESC)")
    op.execute("""
        CREATE OR REPLACE FUNCTION sync_historical_location_geom()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
                NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("DROP TRIGGER IF EXISTS trg_sync_historical_location_geom ON historical_locations")
    op.execute("""
        CREATE TRIGGER trg_sync_historical_location_geom
        BEFORE INSERT OR UPDATE OF latitude, longitude
        ON historical_locations
        FOR EACH ROW EXECUTE FUNCTION sync_historical_location_geom()
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_sync_historical_location_geom ON historical_locations")
    op.execute("DROP FUNCTION IF EXISTS sync_historical_location_geom")
    op.drop_index('idx_historical_locations_sensor_time', table_name='historical_locations')
    op.drop_index('idx_historical_locations_geom', table_name='historical_locations', postgresql_using='gist')
    op.drop_column('historical_locations', 'geom')

    op.execute("DROP TRIGGER IF EXISTS trg_sync_location_geom ON locations")
    op.execute("DROP FUNCTION IF EXISTS sync_location_geom")
    op.drop_index('idx_locations_geom', table_name='locations', postgresql_using='gist')
    op.drop_column('locations', 'geom')

    op.drop_index('idx_alert_events_triggered', table_name='alert_events', postgresql_ops={'triggered_at': 'DESC'})
    op.create_index(op.f('idx_alert_events_triggered'), 'alert_events', [sa.literal_column('triggered_at DESC')], unique=False)
