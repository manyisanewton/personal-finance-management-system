"""Add accounts and transfer fields

Revision ID: 4a7d9c2e1f0b
Revises: 3f2b1c4d5e6f
Create Date: 2025-04-15 14:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4a7d9c2e1f0b'
down_revision = '3f2b1c4d5e6f'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'accounts' not in inspector.get_table_names():
        op.create_table(
            'accounts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=120), nullable=False),
            sa.Column('type', sa.String(length=40), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=False, server_default='USD'),
            sa.Column('starting_balance', sa.Float(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )

    with op.batch_alter_table('recurring_transactions', schema=None) as batch_op:
        if 'account_id' not in [col['name'] for col in inspector.get_columns('recurring_transactions')]:
            batch_op.add_column(sa.Column('account_id', sa.Integer(), nullable=True))
        existing_fk = {fk['name'] for fk in inspector.get_foreign_keys('recurring_transactions') if fk['name']}
        if 'fk_recurring_transactions_account' not in existing_fk:
            batch_op.create_foreign_key(
                'fk_recurring_transactions_account',
                'accounts',
                ['account_id'],
                ['id'],
                ondelete='SET NULL'
            )

    with op.batch_alter_table('transactions', schema=None) as batch_op:
        existing_columns = {col['name'] for col in inspector.get_columns('transactions')}
        if 'account_id' not in existing_columns:
            batch_op.add_column(sa.Column('account_id', sa.Integer(), nullable=True))
        if 'transfer_group_id' not in existing_columns:
            batch_op.add_column(sa.Column('transfer_group_id', sa.String(length=36), nullable=True))
        if 'is_transfer' not in existing_columns:
            batch_op.add_column(sa.Column('is_transfer', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        existing_fk = {fk['name'] for fk in inspector.get_foreign_keys('transactions') if fk['name']}
        if 'fk_transactions_account' not in existing_fk:
            batch_op.create_foreign_key(
                'fk_transactions_account',
                'accounts',
                ['account_id'],
                ['id'],
                ondelete='SET NULL'
            )


def downgrade():
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_constraint('fk_transactions_account', type_='foreignkey')
        batch_op.drop_column('is_transfer')
        batch_op.drop_column('transfer_group_id')
        batch_op.drop_column('account_id')

    with op.batch_alter_table('recurring_transactions', schema=None) as batch_op:
        batch_op.drop_constraint('fk_recurring_transactions_account', type_='foreignkey')
        batch_op.drop_column('account_id')

    op.drop_table('accounts')
