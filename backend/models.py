from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    reminder_day = db.Column(db.String(10), nullable=True, default='mon')
    reminder_hour = db.Column(db.Integer, nullable=True, default=8)


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)


class Account(db.Model):
    __tablename__ = 'accounts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(40), nullable=False)
    currency = db.Column(db.String(10), nullable=False, default='USD')
    starting_balance = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship('User', backref='accounts')


class RecurringTransaction(db.Model):
    __tablename__ = 'recurring_transactions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'))
    category = db.relationship("Category", backref="recurring_transactions")
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id', ondelete='SET NULL'))
    account = db.relationship("Account", backref="recurring_transactions")
    frequency = db.Column(db.String(20), nullable=False)
    next_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    remaining_occurrences = db.Column(db.Integer, nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    date = db.Column(db.Date, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'))
    category = db.relationship("Category", backref="transactions")
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id', ondelete='SET NULL'))
    account = db.relationship("Account", backref="transactions")
    recurring_id = db.Column(db.Integer, db.ForeignKey('recurring_transactions.id', ondelete='SET NULL'))
    is_recurring = db.Column(db.Boolean, nullable=False, default=False)
    recurring_transaction = db.relationship("RecurringTransaction", backref="transactions")
    transfer_group_id = db.Column(db.String(36), nullable=True)
    is_transfer = db.Column(db.Boolean, nullable=False, default=False)
    is_cleared = db.Column(db.Boolean, nullable=False, default=False)


class TransactionSplit(db.Model):
    __tablename__ = 'transaction_splits'

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    note = db.Column(db.String(120), nullable=True)

    transaction = db.relationship('Transaction', backref='splits')
    category = db.relationship('Category', backref='transaction_splits')


class RecurringPostEvent(db.Model):
    __tablename__ = 'recurring_post_events'

    id = db.Column(db.Integer, primary_key=True)
    recurring_id = db.Column(db.Integer, db.ForeignKey('recurring_transactions.id', ondelete='CASCADE'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False)
    posted_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    recurring_transaction = db.relationship("RecurringTransaction", backref="post_events")
    transaction = db.relationship("Transaction", backref="post_events")


class AccountStatement(db.Model):
    __tablename__ = 'account_statements'

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False)
    statement_date = db.Column(db.Date, nullable=False)
    statement_balance = db.Column(db.Float, nullable=False)
    cleared_balance = db.Column(db.Float, nullable=False)
    difference = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    account = db.relationship('Account', backref='statements')


class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    category = db.relationship('Category', backref='budgets')
    month = db.Column(db.String(7), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    alert_thresholds = db.Column(db.String(50), nullable=False, default='50,75,90,100')


class BudgetAlert(db.Model):
    __tablename__ = 'budget_alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    month = db.Column(db.String(7), nullable=False)
    threshold = db.Column(db.Integer, nullable=False)
    percent_used = db.Column(db.Float, nullable=False)
    total_spent = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship('User', backref='budget_alerts')
    budget = db.relationship('Budget', backref='alerts')
    category = db.relationship('Category', backref='budget_alerts')


class ExchangeRate(db.Model):
    __tablename__ = 'exchange_rates'

    id = db.Column(db.Integer, primary_key=True)
    base_currency = db.Column(db.String(10), nullable=False)
    target_currency = db.Column(db.String(10), nullable=False)
    rate = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)
