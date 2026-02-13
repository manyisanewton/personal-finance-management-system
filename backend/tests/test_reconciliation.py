import datetime
import io

import pytest

from app import create_app, bcrypt
from models import db, Account, Transaction, User, Category


@pytest.fixture
def client():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-secret',
    })
    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(
            username='tester',
            email='tester@example.com',
            password=bcrypt.generate_password_hash('password').decode('utf-8')
        )
        db.session.add(user)
        db.session.commit()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def login(client):
    return client.post('/api/login', json={
        'username': 'tester',
        'password': 'password',
    })


def test_reconciliation_creates_statement(client):
    assert login(client).status_code == 200

    with client.application.app_context():
        account = Account(name='Checking', type='checking', currency='USD', starting_balance=100, user_id=1)
        db.session.add(account)
        db.session.commit()
        account_id = account.id

        cleared_income = Transaction(
            title='Paycheck',
            amount=50,
            type='Income',
            date=datetime.date(2026, 1, 1),
            account_id=account_id,
            is_cleared=True,
        )
        cleared_expense = Transaction(
            title='Groceries',
            amount=20,
            type='Expense',
            date=datetime.date(2026, 1, 2),
            account_id=account_id,
            is_cleared=True,
        )
        uncleared_expense = Transaction(
            title='Pending',
            amount=10,
            type='Expense',
            date=datetime.date(2026, 1, 2),
            account_id=account_id,
            is_cleared=False,
        )
        db.session.add_all([cleared_income, cleared_expense, uncleared_expense])
        db.session.commit()

    response = client.post(f'/api/accounts/{account_id}/reconciliations', json={
        'statement_date': '2026-01-02',
        'statement_balance': 125,
    })

    assert response.status_code == 201
    data = response.get_json()
    assert data['cleared_balance'] == 130
    assert data['difference'] == -5


def test_csv_import_creates_transactions(client):
    assert login(client).status_code == 200

    with client.application.app_context():
        account = Account(name='Savings', type='savings', currency='USD', starting_balance=0, user_id=1)
        category = Category(name='Groceries')
        db.session.add_all([account, category])
        db.session.commit()
        account_id = account.id

    csv_data = "date,title,amount,type,category\n2026-01-05,Market,40.50,Expense,Groceries\n"
    data = {
        'file': (io.BytesIO(csv_data.encode('utf-8')), 'statement.csv')
    }
    response = client.post(
        f'/api/accounts/{account_id}/statement_import',
        data=data,
        content_type='multipart/form-data'
    )

    assert response.status_code == 201
    result = response.get_json()
    assert result['created'] == 1

    with client.application.app_context():
        transactions = Transaction.query.filter_by(account_id=account_id).all()
        assert len(transactions) == 1
        assert transactions[0].is_cleared is True
        assert transactions[0].category_id is not None
