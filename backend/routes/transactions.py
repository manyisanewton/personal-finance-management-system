from flask import Blueprint, jsonify, request, send_file
from database import db
from models import Transaction
import io
import csv
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        month = request.args.get('month')
        year = request.args.get('year')
        category_id = request.args.get('category_id')
        type = request.args.get('type')
        search = request.args.get('search')

        query = Transaction.query

        if month and year:
            query = query.filter(
                Transaction.date.startswith(f"{year}-{month}")
            )
        elif year:
            query = query.filter(Transaction.date.startswith(year))

        if category_id:
            query = query.filter_by(category_id=int(category_id))

        if type:
            query = query.filter_by(type=type)

        if search:
            query = query.filter(Transaction.title.ilike(f"%{search}%"))

        transactions = query.all()
        return jsonify([
            {
                'id': t.id,
                'title': t.title,
                'amount': t.amount,
                'type': t.type,
                'date': t.date,
                'category_id': t.category_id
            } for t in transactions
        ])
    except Exception as e:
        return jsonify({'message': f'Error fetching transactions: {str(e)}'}), 500

@transactions_bp.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    if not data or not all(key in data for key in ['title', 'amount', 'type', 'date']):
        return jsonify({'message': 'Title, amount, type, and date are required'}), 400
    if len(data['title']) > 120:
        return jsonify({'message': 'Title too long (max 120 characters)'}), 400
    if data['amount'] <= 0:
        return jsonify({'message': 'Amount must be positive'}), 400
    if data['type'] not in ['Income', 'Expense']:
        return jsonify({'message': 'Type must be Income or Expense'}), 400
    try:
        # Validate date format (YYYY-MM-DD)
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400

    new_transaction = Transaction(
        title=data['title'],
        amount=float(data['amount']),
        type=data['type'],
        date=data['date'],
        category_id=data.get('category_id')
    )
    try:
        db.session.add(new_transaction)
        db.session.commit()
        return jsonify({
            'id': new_transaction.id,
            'title': new_transaction.title,
            'amount': new_transaction.amount,
            'type': new_transaction.type,
            'date': new_transaction.date,
            'category_id': new_transaction.category_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding transaction: {str(e)}'}), 500

@transactions_bp.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    transaction = Transaction.query.get(id)
    if not transaction:
        return jsonify({'message': 'Transaction not found'}), 404
    data = request.get_json()
    if not data or not all(key in data for key in ['title', 'amount', 'type', 'date']):
        return jsonify({'message': 'Title, amount, type, and date are required'}), 400
    if len(data['title']) > 120:
        return jsonify({'message': 'Title too long (max 120 characters)'}), 400
    if data['amount'] <= 0:
        return jsonify({'message': 'Amount must be positive'}), 400
    if data['type'] not in ['Income', 'Expense']:
        return jsonify({'message': 'Type must be Income or Expense'}), 400
    try:
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400

    try:
        transaction.title = data['title']
        transaction.amount = float(data['amount'])
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
            'category_id': transaction.category_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating transaction: {str(e)}'}), 500

@transactions_bp.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get(id)
    if not transaction:
        return jsonify({'message': 'Transaction not found'}), 404
    try:
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting transaction: {str(e)}'}), 500

@transactions_bp.route('/api/transactions/export', methods=['GET'])
def export_transactions():
    try:
        month = request.args.get('month')
        year = request.args.get('year')
        category_id = request.args.get('category_id')
        type = request.args.get('type')

        query = Transaction.query

        if month and year:
            query = query.filter(
                Transaction.date.startswith(f"{year}-{month}")
            )
        elif year:
            query = query.filter(Transaction.date.startswith(year))

        if category_id:
            query = query.filter_by(category_id=int(category_id))

        if type:
            query = query.filter_by(type=type)

        transactions = query.all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Title', 'Amount', 'Type', 'Date', 'Category ID'])
        for t in transactions:
            writer.writerow([t.id, t.title, t.amount, t.type, t.date, t.category_id])
        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='transactions.csv'
        )
    except Exception as e:
        return jsonify({'message': f'Error exporting transactions: {str(e)}'}), 500