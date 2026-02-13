"""Add account user_id

Revision ID: 5b1f0c9d8e7a
Revises: 4a7d9c2e1f0b
Create Date: 2025-04-15 14:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5b1f0c9d8e7a'
down_revision = '4a7d9c2e1f0b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('accounts', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_accounts_user',
        'accounts',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade():
    op.drop_constraint('fk_accounts_user', 'accounts', type_='foreignkey')
    op.drop_column('accounts', 'user_id')
