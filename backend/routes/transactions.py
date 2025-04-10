from flask import Blueprint, request, jsonify
from backend.models import db, Transaction  # Instead of: from ..models import db, Transaction

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.all()
    return jsonify([
        {
            'id': t.id,
            'title': t.title,
            'amount': t.amount,
            'type': t.type,
            'date': t.date,
            'category_id': t.category_id,
            'category': t.category.name if t.category else None
        }
        for t in transactions
    ])

@transactions_bp.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.get_json()
    transaction = Transaction(
        title=data['title'],
        amount=data['amount'],
        type=data['type'],
        date=data['date'],
        category_id=data.get('category_id')
    )
    db.session.add(transaction)
    db.session.commit()
    return jsonify({'message': 'Transaction created!'}), 201

@transactions_bp.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    data = request.get_json()
    transaction.title = data['title']
    transaction.amount = data['amount']
    transaction.type = data['type']
    transaction.date = data['date']
    transaction.category_id = data.get('category_id')

    db.session.commit()

    return jsonify({
        'id': transaction.id,
        'title': transaction.title,
        'amount': transaction.amount,
        'type': transaction.type,
        'date': transaction.date,
        'category_id': transaction.category_id,
        'category': transaction.category.name if transaction.category else None,
        'message': 'Transaction updated!'
    })


@transactions_bp.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted!'})
