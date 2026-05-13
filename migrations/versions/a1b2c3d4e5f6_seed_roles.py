"""seed_roles

Revision ID: a1b2c3d4e5f6
Revises: c8d313773e11
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c8d313773e11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO roles (id, name) VALUES
            (gen_random_uuid(), 'admin'),
            (gen_random_uuid(), 'editor'),
            (gen_random_uuid(), 'viewer')
        ON CONFLICT (name) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DELETE FROM roles WHERE name IN ('admin', 'editor', 'viewer')")
