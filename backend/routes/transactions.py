from flask import Blueprint, request, jsonify
from models import db, Transaction, Category,Budget
from datetime import datetime
from sqlalchemy.orm import joinedload

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        month = request.args.get('month')
        year = request.args.get('year')
        category_id = request.args.get('category_id')
        type = request.args.get('type')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        sort_field = request.args.get('sort_field', 'date')
        sort_order = request.args.get('sort_order', 'desc')

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

        # Apply sorting
        if sort_field == 'date':
            query = query.order_by(Transaction.date.desc() if sort_order == 'desc' else Transaction.date.asc())
        elif sort_field == 'amount':
            query = query.order_by(Transaction.amount.desc() if sort_order == 'desc' else Transaction.amount.asc())

        # Pagination
        total_items = query.count()
        total_pages = (total_items + per_page - 1) // per_page
        transactions = query.offset((page - 1) * per_page).limit(per_page).all()

        return jsonify({
            'transactions': [
                {
                    'id': t.id,
                    'title': t.title,
                    'amount': t.amount,
                    'type': t.type,
                    'date': t.date,
                    'category_id': t.category_id
                } for t in transactions
            ],
            'total_pages': total_pages,
            'total_items': total_items
        })
    except Exception as e:
        return jsonify({'message': f'Error fetching transactions: {str(e)}'}), 500

@transactions_bp.route('/api/transactions', methods=['POST'])
def add_transaction():
    try:
        print("Raw request data:", request.data)
        data = request.get_json()
        print("Received JSON data:", data)
        title = data['title']  # Corrected assignment
        amount = data['amount']  # Corrected assignment
        type = data['type']    # Corrected assignment
        date_str = data['date']  # Corrected assignment
        category_id = data.get('category_id')

        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format. PLease use YYYY-MM-DD'}), 400

        new_transaction = Transaction(
            title=title,
            amount=amount,
            type=type,
            date=date_obj,
            category_id=category_id
        )
        db.session.add(new_transaction)
        db.session.commit()

        # Checks  budget limit if the transaction is an expense
        budget_exceeded = False
        budget_message = None
        if new_transaction.type == 'Expense' and new_transaction.category_id:
            month = new_transaction.date.strftime('%Y-%m')  # Extract YYYY-MM from date
            budget = Budget.query.filter_by(category_id=new_transaction.category_id, month=month).first()
            if budget:
                # It Calculates total expenses for this category and month
                total_expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
                    Transaction.category_id == new_transaction.category_id,
                    Transaction.type == 'Expense',
                    Transaction.date.startswith(month)
                ).scalar() or 0
                if total_expenses > budget.amount:
                    budget_exceeded = True
                    budget_message = f"Warning: You have exceeded your budget of {budget.amount} for category '{budget.category.name}' this month. Total expenses: {total_expenses}."

        response = {
            'id': new_transaction.id,
            'title': new_transaction.title,
            'amount': new_transaction.amount,
            'type': new_transaction.type,
            'date': new_transaction.date.strftime('%Y-%m-%d'),
            'category_id': new_transaction.category_id,
            'budget_exceeded': budget_exceeded,
            'budget_message': budget_message
        }
        return jsonify(response), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding transaction: {str(e)}'}), 500


@transactions_bp.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    try:
        data = request.get_json()
        transaction = Transaction.query.get_or_404(id)
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
            'category_id': transaction.category_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating transaction: {str(e)}'}), 500

@transactions_bp.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    try:
        transaction = Transaction.query.get_or_404(id)
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting transaction: {str(e)}'}), 500

@transactions_bp.route('/api/transactions/bulk_delete', methods=['POST'])
def bulk_delete_transactions():
    try:
        data = request.get_json()
        transaction_ids = data.get('ids', [])
        if not transaction_ids:
            return jsonify({'message': 'No transactions selected for deletion'}), 400

        Transaction.query.filter(Transaction.id.in_(transaction_ids)).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({'message': 'Selected transactions deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting transactions: {str(e)}'}), 500

#  for recent transactions
@transactions_bp.route('/api/recent_transactions', methods=['GET'])
def get_recent_transactions():
    try:
        transactions = (
            Transaction.query
            .options(joinedload(Transaction.category))
            .order_by(Transaction.date.desc())
            .limit(5)
            .all()
        )

        result = []
        for t in transactions:
            try:
                result.append({                
                    'id': t.id,
                    'title': t.title,
                    'amount': t.amount,
                    'type': t.type,
                    'date': t.date.strftime('%Y-%m-%d') if t.date else None,
                    'category': t.category.name if t.category else "Uncategorized"
                })
            except Exception as inner_e:
                print(f"Error formatting transactio ID {t.id}: {inner_e}")
                continue        

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching recent transactions: {str(e)}'}), 500