"""Add budgets and exchange rates

Revision ID: 2d1f2a3b4c5d
Revises: 9c4a2e7d3d1b
Create Date: 2025-04-15 13:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2d1f2a3b4c5d'
down_revision = '9c4a2e7d3d1b'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'exchange_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('base_currency', sa.String(length=10), nullable=False),
        sa.Column('target_currency', sa.String(length=10), nullable=False),
        sa.Column('rate', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('exchange_rates')
    op.drop_table('budgets')
