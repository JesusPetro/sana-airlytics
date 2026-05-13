"""add_zones_workspace_index

Revision ID: c1d2e3f4a5b6
Revises: a1b2c3d4e5f6
Create Date: 2026-05-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_zones_workspace ON zones (workspace_id)"
    )


def downgrade() -> None:
    op.drop_index("idx_zones_workspace", table_name="zones")
