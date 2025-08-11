"""baseline (existing schema)

Revision ID: 744e6d9f1d56
Revises: 
Create Date: 2025-08-11 18:45:02.419851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '744e6d9f1d56'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
