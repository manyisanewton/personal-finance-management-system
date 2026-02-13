"""Add reconciliation fields

Revision ID: 7a1f2b3c4d5e
Revises: 6c8a3f1b2d4e
Create Date: 2025-04-15 16:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a1f2b3c4d5e'
down_revision = '6c8a3f1b2d4e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('transactions', sa.Column('is_cleared', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    op.create_table(
        'account_statements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('statement_date', sa.Date(), nullable=False),
        sa.Column('statement_balance', sa.Float(), nullable=False),
        sa.Column('cleared_balance', sa.Float(), nullable=False),
        sa.Column('difference', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('account_statements')
    op.drop_column('transactions', 'is_cleared')
