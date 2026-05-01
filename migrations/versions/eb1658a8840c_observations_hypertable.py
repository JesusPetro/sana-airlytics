"""observations_hypertable

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
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
    op.execute(sa.text(
        "SELECT create_hypertable('observations', 'phenomenon_time', if_not_exists => TRUE)"
    ))


def downgrade() -> None:
    pass  # TimescaleDB no soporta convertir una hypertable de vuelta a tabla regular
