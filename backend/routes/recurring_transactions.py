from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, RecurringTransaction, RecurringPostEvent, Transaction

recurring_transactions_bp = Blueprint('recurring_transactions', __name__)

ALLOWED_FREQUENCIES = {
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'annually',
}

ALLOWED_TYPES = {'Income', 'Expense'}


def _parse_date(value, field_name):
    try:
        return datetime.strptime(value, '%Y-%m-%d').date(), None
    except (TypeError, ValueError):
        return None, f"Invalid {field_name} format. Use YYYY-MM-DD."


@recurring_transactions_bp.route('/api/recurring_transactions', methods=['GET'])
def get_recurring_transactions():
    recurrences = RecurringTransaction.query.order_by(RecurringTransaction.next_date.asc()).all()
    return jsonify([
        {
            'id': r.id,
            'title': r.title,
            'amount': r.amount,
            'type': r.type,
            'category_id': r.category_id,
            'account_id': r.account_id,
            'frequency': r.frequency,
            'next_date': r.next_date.strftime('%Y-%m-%d') if r.next_date else None,
            'end_date': r.end_date.strftime('%Y-%m-%d') if r.end_date else None,
            'remaining_occurrences': r.remaining_occurrences,
            'active': r.active,
        }
        for r in recurrences
    ]), 200


@recurring_transactions_bp.route('/api/recurring_transactions', methods=['POST'])
def create_recurring_transaction():
    data = request.get_json() or {}
    title = data.get('title')
    amount = data.get('amount')
    txn_type = data.get('type')
    frequency = data.get('frequency')
    next_date_raw = data.get('next_date') or data.get('start_date')
    end_date_raw = data.get('end_date')
    remaining_occurrences = data.get('remaining_occurrences')
    category_id = data.get('category_id')
    account_id = data.get('account_id')

    if not title or not str(title).strip():
        return jsonify({'message': 'Title is required'}), 400
    if amount is None or float(amount) <= 0:
        return jsonify({'message': 'Amount must be a positive number'}), 400
    if txn_type not in ALLOWED_TYPES:
        return jsonify({'message': 'Type must be Income or Expense'}), 400
    if frequency not in ALLOWED_FREQUENCIES:
        return jsonify({'message': f'Frequency must be one of {sorted(ALLOWED_FREQUENCIES)}'}), 400
    if not next_date_raw:
        return jsonify({'message': 'next_date is required'}), 400

    next_date, error = _parse_date(next_date_raw, 'next_date')
    if error:
        return jsonify({'message': error}), 400

    end_date = None
    if end_date_raw:
        end_date, error = _parse_date(end_date_raw, 'end_date')
        if error:
            return jsonify({'message': error}), 400

    if remaining_occurrences is not None:
        try:
            remaining_occurrences = int(remaining_occurrences)
        except (TypeError, ValueError):
            return jsonify({'message': 'remaining_occurrences must be an integer'}), 400
        if remaining_occurrences < 1:
            return jsonify({'message': 'remaining_occurrences must be at least 1'}), 400

    recurring = RecurringTransaction(
        title=str(title).strip(),
        amount=float(amount),
        type=txn_type,
        frequency=frequency,
        next_date=next_date,
        end_date=end_date,
        remaining_occurrences=remaining_occurrences,
        category_id=category_id,
        account_id=account_id,
        active=True,
    )

    db.session.add(recurring)
    db.session.commit()

    return jsonify({
        'id': recurring.id,
        'title': recurring.title,
        'amount': recurring.amount,
        'type': recurring.type,
        'category_id': recurring.category_id,
        'account_id': recurring.account_id,
        'frequency': recurring.frequency,
        'next_date': recurring.next_date.strftime('%Y-%m-%d'),
        'end_date': recurring.end_date.strftime('%Y-%m-%d') if recurring.end_date else None,
        'remaining_occurrences': recurring.remaining_occurrences,
        'active': recurring.active,
    }), 201


@recurring_transactions_bp.route('/api/recurring_transactions/<int:recurring_id>', methods=['PUT'])
def update_recurring_transaction(recurring_id):
    recurring = RecurringTransaction.query.get_or_404(recurring_id)
    data = request.get_json() or {}

    if 'title' in data and str(data['title']).strip():
        recurring.title = str(data['title']).strip()
    if 'amount' in data:
        try:
            amount = float(data['amount'])
        except (TypeError, ValueError):
            return jsonify({'message': 'Amount must be a number'}), 400
        if amount <= 0:
            return jsonify({'message': 'Amount must be positive'}), 400
        recurring.amount = amount
    if 'type' in data:
        if data['type'] not in ALLOWED_TYPES:
            return jsonify({'message': 'Type must be Income or Expense'}), 400
        recurring.type = data['type']
    if 'frequency' in data:
        if data['frequency'] not in ALLOWED_FREQUENCIES:
            return jsonify({'message': f'Frequency must be one of {sorted(ALLOWED_FREQUENCIES)}'}), 400
        recurring.frequency = data['frequency']
    if 'next_date' in data:
        next_date, error = _parse_date(data['next_date'], 'next_date')
        if error:
            return jsonify({'message': error}), 400
        recurring.next_date = next_date
    if 'end_date' in data:
        if data['end_date']:
            end_date, error = _parse_date(data['end_date'], 'end_date')
            if error:
                return jsonify({'message': error}), 400
            recurring.end_date = end_date
        else:
            recurring.end_date = None
    if 'remaining_occurrences' in data:
        if data['remaining_occurrences'] is None:
            recurring.remaining_occurrences = None
        else:
            try:
                remaining_occurrences = int(data['remaining_occurrences'])
            except (TypeError, ValueError):
                return jsonify({'message': 'remaining_occurrences must be an integer'}), 400
            if remaining_occurrences < 1:
                return jsonify({'message': 'remaining_occurrences must be at least 1'}), 400
            recurring.remaining_occurrences = remaining_occurrences
    if 'category_id' in data:
        recurring.category_id = data['category_id']
    if 'account_id' in data:
        recurring.account_id = data['account_id']
    if 'active' in data:
        recurring.active = bool(data['active'])

    db.session.commit()

    return jsonify({
        'id': recurring.id,
        'title': recurring.title,
        'amount': recurring.amount,
        'type': recurring.type,
        'category_id': recurring.category_id,
        'account_id': recurring.account_id,
        'frequency': recurring.frequency,
        'next_date': recurring.next_date.strftime('%Y-%m-%d') if recurring.next_date else None,
        'end_date': recurring.end_date.strftime('%Y-%m-%d') if recurring.end_date else None,
        'remaining_occurrences': recurring.remaining_occurrences,
        'active': recurring.active,
    }), 200


@recurring_transactions_bp.route('/api/recurring_transactions/<int:recurring_id>', methods=['DELETE'])
def delete_recurring_transaction(recurring_id):
    recurring = RecurringTransaction.query.get_or_404(recurring_id)
    db.session.delete(recurring)
    db.session.commit()
    return jsonify({'message': 'Recurring transaction deleted successfully'}), 200


@recurring_transactions_bp.route('/api/recurring_posts', methods=['GET'])
def get_recurring_posts():
    limit = request.args.get('limit', 10)
    try:
        limit = max(1, min(int(limit), 50))
    except (TypeError, ValueError):
        limit = 10

    events = (
        RecurringPostEvent.query
        .order_by(RecurringPostEvent.posted_at.desc())
        .limit(limit)
        .all()
    )

    response = []
    for event in events:
        txn = event.transaction
        response.append({
            'id': event.id,
            'posted_at': event.posted_at.isoformat(),
            'recurring_id': event.recurring_id,
            'transaction': {
                'id': txn.id,
                'title': txn.title,
                'amount': txn.amount,
                'type': txn.type,
                'date': txn.date.strftime('%Y-%m-%d') if txn.date else None,
                'category_id': txn.category_id,
                'account_id': txn.account_id,
                'is_recurring': txn.is_recurring,
            } if txn else None,
        })

    return jsonify(response), 200
