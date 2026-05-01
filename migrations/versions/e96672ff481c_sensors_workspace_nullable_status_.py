"""sensors_workspace_nullable_status_pending

Revision ID: e96672ff481c
Revises: 9b30c8714442
Create Date: 2026-04-30 23:02:53.719400

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e96672ff481c'
down_revision: Union[str, Sequence[str], None] = '9b30c8714442'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("sensors", "workspace_id", existing_type=sa.UUID(), nullable=True)
    op.alter_column("sensors", "status", existing_type=sa.String(), server_default="PENDING")


def downgrade() -> None:
    op.alter_column("sensors", "status", existing_type=sa.String(), server_default="ACTIVE")
    op.alter_column("sensors", "workspace_id", existing_type=sa.UUID(), nullable=False)
