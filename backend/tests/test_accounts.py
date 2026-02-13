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


def test_create_account_and_list(client):
    login_response = login(client)
    assert login_response.status_code == 200

    response = client.post('/api/accounts', json={
        'name': 'Checking',
        'type': 'checking',
        'currency': 'USD',
        'starting_balance': 1000,
    })
    assert response.status_code == 201

    list_response = client.get('/api/accounts')
    assert list_response.status_code == 200
    data = list_response.get_json()
    assert len(data) == 1
    assert data[0]['name'] == 'Checking'
    assert data[0]['current_balance'] == 1000


def test_transfer_creates_two_transactions(client):
    login_response = login(client)
    assert login_response.status_code == 200

    with client.application.app_context():
        from_account = Account(name='Checking', type='checking', currency='USD', starting_balance=0, user_id=1)
        to_account = Account(name='Savings', type='savings', currency='USD', starting_balance=0, user_id=1)
        db.session.add_all([from_account, to_account])
        db.session.commit()
        from_id = from_account.id
        to_id = to_account.id

    response = client.post('/api/transfers', json={
        'from_account_id': from_id,
        'to_account_id': to_id,
        'amount': 150,
        'date': datetime.date.today().strftime('%Y-%m-%d'),
        'title': 'Move funds',
    })
    assert response.status_code == 201

    with client.application.app_context():
        transactions = Transaction.query.all()
        assert len(transactions) == 2
        types = sorted([t.type for t in transactions])
        assert types == ['Expense', 'Income']
        assert all(t.is_transfer for t in transactions)
