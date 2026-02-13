"""Add transaction splits

Revision ID: ae3d2c4f5b6a
Revises: 8d2f4c1a9eab
Create Date: 2026-01-20 19:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = 'ae3d2c4f5b6a'
down_revision = '8d2f4c1a9eab'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'transaction_splits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('note', sa.String(length=120), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('transaction_splits')
