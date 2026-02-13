import datetime

import pytest

from app import create_app, bcrypt
from models import db, Budget, Category, Transaction, User


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


def test_budget_alert_created_on_transaction(client):
    assert login(client).status_code == 200

    today = datetime.date(2026, 1, 20)
    month = today.strftime('%Y-%m')

    with client.application.app_context():
        category = Category(name='Food')
        db.session.add(category)
        db.session.commit()
        budget = Budget(category_id=category.id, month=month, amount=100, alert_thresholds='50,75')
        db.session.add(budget)
        db.session.commit()
        category_id = category.id

    response = client.post('/api/transactions', json={
        'title': 'Groceries',
        'amount': 60,
        'type': 'Expense',
        'date': today.strftime('%Y-%m-%d'),
        'category_id': category_id,
        'account_id': None,
    })
    assert response.status_code == 201

    alerts_response = client.get('/api/budget_alerts?limit=10')
    assert alerts_response.status_code == 200
    data = alerts_response.get_json()
    assert data['unread_count'] == 1
    assert data['alerts'][0]['threshold'] == 50
    assert data['alerts'][0]['percent_used'] >= 50
