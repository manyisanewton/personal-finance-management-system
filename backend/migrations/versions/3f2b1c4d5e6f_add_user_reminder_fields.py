"""Add user reminder fields

Revision ID: 3f2b1c4d5e6f
Revises: 2d1f2a3b4c5d
Create Date: 2025-04-15 13:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3f2b1c4d5e6f'
down_revision = '2d1f2a3b4c5d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('reminder_day', sa.String(length=10), nullable=True, server_default='mon'))
    op.add_column('users', sa.Column('reminder_hour', sa.Integer(), nullable=True, server_default='8'))


def downgrade():
    op.drop_column('users', 'reminder_hour')
    op.drop_column('users', 'reminder_day')
