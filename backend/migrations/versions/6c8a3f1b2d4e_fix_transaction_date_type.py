"""Fix transactions date type

Revision ID: 6c8a3f1b2d4e
Revises: 5b1f0c9d8e7a
Create Date: 2025-04-15 15:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6c8a3f1b2d4e'
down_revision = '5b1f0c9d8e7a'
branch_labels = None
depends_on = None


def upgrade():
    dialect = op.get_context().dialect.name
    if dialect == 'postgresql':
        op.alter_column(
            'transactions',
            'date',
            type_=sa.Date(),
            postgresql_using='date::date'
        )
    elif dialect == 'sqlite':
        with op.batch_alter_table('transactions') as batch_op:
            batch_op.alter_column('date', type_=sa.Date())


def downgrade():
    dialect = op.get_context().dialect.name
    if dialect == 'postgresql':
        op.alter_column(
            'transactions',
            'date',
            type_=sa.String(),
            postgresql_using='date::text'
        )
    elif dialect == 'sqlite':
        with op.batch_alter_table('transactions') as batch_op:
            batch_op.alter_column('date', type_=sa.String())
