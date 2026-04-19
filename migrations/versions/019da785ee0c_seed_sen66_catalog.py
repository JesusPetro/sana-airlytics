"""seed_sen66_catalog

Revision ID: 019da785ee0c
Revises: 7b800efb4eb6
Create Date: 2026-04-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "019da785ee0c"
down_revision: Union[str, Sequence[str], None] = "7b800efb4eb6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text("""
            INSERT INTO observed_properties (id, code, name, definition, type)
            VALUES
                (gen_random_uuid(), 'PM1',         'PM1.0',             'Airborne particles with aerodynamic diameter <= 1.0 um',                              'atmospheric'),
                (gen_random_uuid(), 'PM2_5',       'PM2.5',             'Airborne particles with aerodynamic diameter <= 2.5 um',                              'atmospheric'),
                (gen_random_uuid(), 'PM4',         'PM4.0',             'Airborne particles with aerodynamic diameter <= 4.0 um',                              'atmospheric'),
                (gen_random_uuid(), 'PM10',        'PM10',              'Airborne particles with aerodynamic diameter <= 10 um',                               'atmospheric'),
                (gen_random_uuid(), 'TEMPERATURE', 'Temperature',       'Ambient air temperature measured by the sensor''s internal probe',                    'meteorological'),
                (gen_random_uuid(), 'HUMIDITY',    'Relative Humidity', 'Ratio of water vapour pressure to saturation pressure at ambient temperature',        'meteorological'),
                (gen_random_uuid(), 'VOC_INDEX',   'VOC Index',         'Relative VOC concentration index (1-500) calibrated against a clean-air baseline',   'index'),
                (gen_random_uuid(), 'NOX_INDEX',   'NOx Index',         'Relative NOx concentration index (1-500) calibrated against a clean-air baseline',   'index'),
                (gen_random_uuid(), 'CO2',         'CO2 Concentration', 'Carbon dioxide concentration measured by NDIR optical sensing',                       'atmospheric')
            ON CONFLICT (code) DO NOTHING
        """)
    )
    op.execute(
        sa.text("""
            INSERT INTO units (id, code, name, symbol, type)
            VALUES
                (gen_random_uuid(), 'UG_M3',  'Micrograms per cubic metre', 'ug/m3', 'concentration'),
                (gen_random_uuid(), 'DEG_C',  'Degrees Celsius',            'degC',  'temperature'),
                (gen_random_uuid(), 'PCT_RH', 'Percent relative humidity',  '%RH',   'humidity'),
                (gen_random_uuid(), 'IDX',    'Index',                      'idx',   'index'),
                (gen_random_uuid(), 'PPM',    'Parts per million',          'ppm',   'concentration')
            ON CONFLICT (code) DO NOTHING
        """)
    )


def downgrade() -> None:
    op.execute(
        sa.text("""
            DELETE FROM observed_properties
            WHERE code IN ('PM1','PM2_5','PM4','PM10','TEMPERATURE','HUMIDITY','VOC_INDEX','NOX_INDEX','CO2')
        """)
    )
    op.execute(
        sa.text("DELETE FROM units WHERE code IN ('UG_M3','DEG_C','PCT_RH','IDX','PPM')")
    )
