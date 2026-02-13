"""Add recurring post events

Revision ID: 9c4a2e7d3d1b
Revises: 7f1c6a2c8b7e
Create Date: 2025-04-15 12:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c4a2e7d3d1b'
down_revision = '7f1c6a2c8b7e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'recurring_post_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recurring_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('posted_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['recurring_id'], ['recurring_transactions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('recurring_post_events')
