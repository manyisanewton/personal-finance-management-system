"""Add recurring transactions

Revision ID: 7f1c6a2c8b7e
Revises: ('01fd6a81bce3', 'b471c5a5d829')
Create Date: 2025-04-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f1c6a2c8b7e'
down_revision = ('01fd6a81bce3', 'b471c5a5d829')
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'recurring_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('next_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('remaining_occurrences', sa.Integer(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('recurring_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.create_foreign_key(
            'fk_transactions_recurring',
            'recurring_transactions',
            ['recurring_id'],
            ['id'],
            ondelete='SET NULL'
        )


def downgrade():
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_constraint('fk_transactions_recurring', type_='foreignkey')
        batch_op.drop_column('is_recurring')
        batch_op.drop_column('recurring_id')

    op.drop_table('recurring_transactions')
