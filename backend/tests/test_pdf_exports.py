import datetime

import pytest

from app import create_app, bcrypt
from models import db, Account, Transaction, User


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


def test_statement_pdf_download(client):
    assert login(client).status_code == 200

    with client.application.app_context():
        account = Account(name='Checking', type='checking', currency='USD', starting_balance=100, user_id=1)
        db.session.add(account)
        db.session.commit()
        db.session.add(Transaction(
            title='Lunch',
            amount=10,
            type='Expense',
            date=datetime.date(2026, 1, 10),
            account_id=account.id,
        ))
        db.session.commit()
        account_id = account.id

    response = client.get(
        f'/api/accounts/{account_id}/statement_pdf?start_date=2026-01-01&end_date=2026-01-31'
    )

    assert response.status_code == 200
    assert response.headers['Content-Type'].startswith('application/pdf')


def test_transaction_invoice_download(client):
    assert login(client).status_code == 200

    with client.application.app_context():
        account = Account(name='Savings', type='savings', currency='USD', starting_balance=0, user_id=1)
        db.session.add(account)
        db.session.commit()
        txn = Transaction(
            title='Salary',
            amount=500,
            type='Income',
            date=datetime.date(2026, 1, 15),
            account_id=account.id,
        )
        db.session.add(txn)
        db.session.commit()
        txn_id = txn.id

    response = client.get(f'/api/transactions/{txn_id}/invoice')

    assert response.status_code == 200
    assert response.headers['Content-Type'].startswith('application/pdf')
