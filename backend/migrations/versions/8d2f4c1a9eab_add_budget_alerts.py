"""Add budget alerts

Revision ID: 8d2f4c1a9eab
Revises: 7a1f2b3c4d5e
Create Date: 2026-01-20 18:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8d2f4c1a9eab'
down_revision = '7a1f2b3c4d5e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('budgets', sa.Column('alert_thresholds', sa.String(length=50), nullable=False, server_default='50,75,90,100'))

    op.create_table(
        'budget_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('threshold', sa.Integer(), nullable=False),
        sa.Column('percent_used', sa.Float(), nullable=False),
        sa.Column('total_spent', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.alter_column('budgets', 'alert_thresholds', server_default=None)


def downgrade():
    op.drop_table('budget_alerts')
    op.drop_column('budgets', 'alert_thresholds')
