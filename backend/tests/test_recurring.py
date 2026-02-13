import datetime

import pytest

from app import create_app
from models import db, Category, RecurringTransaction, Transaction, RecurringPostEvent
from scheduler import process_recurring_transactions_job


@pytest.fixture
def client():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
    })
    with app.app_context():
        db.drop_all()
        db.create_all()
        db.session.add(Category(name='Food'))
        db.session.commit()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_create_and_list_recurring_transactions(client):
    app = client.application
    with app.app_context():
        category_id = Category.query.first().id

    payload = {
        'title': 'Monthly Rent',
        'amount': 1200,
        'type': 'Expense',
        'category_id': category_id,
        'frequency': 'monthly',
        'next_date': datetime.date.today().strftime('%Y-%m-%d'),
    }
    response = client.post('/api/recurring_transactions', json=payload)
    assert response.status_code == 201

    list_response = client.get('/api/recurring_transactions')
    assert list_response.status_code == 200
    data = list_response.get_json()
    assert len(data) == 1
    assert data[0]['title'] == 'Monthly Rent'


def test_recurring_post_event_created(client):
    today = datetime.date.today()
    app = client.application
    with app.app_context():
        category_id = Category.query.first().id
        recurrence = RecurringTransaction(
            title='Gym Membership',
            amount=50.0,
            type='Expense',
            category_id=category_id,
            frequency='monthly',
            next_date=today,
            remaining_occurrences=1,
            active=True,
        )
        db.session.add(recurrence)
        db.session.commit()

        process_recurring_transactions_job()

        txns = Transaction.query.all()
        events = RecurringPostEvent.query.all()
        updated = RecurringTransaction.query.get(recurrence.id)

    assert len(txns) == 1
    assert txns[0].is_recurring is True
    assert len(events) == 1
    assert updated.active is False
