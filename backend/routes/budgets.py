from flask import Blueprint, request, jsonify
from models import db, Budget, Category, Transaction
from datetime import datetime
from sqlalchemy import extract

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/api/budgets', methods=['GET'])
def get_budgets():
    try:
        month = request.args.get('month')  # Format: YYYY-MM
        if not month:
            month = datetime.now().strftime('%Y-%m')

        budgets = Budget.query.filter_by(month=month).all()
        return jsonify([
            {
                'id': b.id,
                'category_id': b.category_id,
                'category_name': b.category.name,
                'month': b.month,
                'amount': b.amount
            } for b in budgets
        ])
    except Exception as e:
        return jsonify({'message': f'Error fetching budgets: {str(e)}'}), 500

@budgets_bp.route('/api/budgets', methods=['POST'])
def add_budget():
    try:
        data = request.get_json()
        month = data.get('month', datetime.now().strftime('%Y-%m'))
        existing_budget = Budget.query.filter_by(category_id=data['category_id'], month=month).first()
        if existing_budget:
            return jsonify({'message': 'Budget already exists for this category and month'}), 400

        new_budget = Budget(
            category_id=data['category_id'],
            month=month,
            amount=data['amount']
        )
        db.session.add(new_budget)
        db.session.commit()
        return jsonify({
            'id': new_budget.id,
            'category_id': new_budget.category_id,
            'category_name': new_budget.category.name,
            'month': new_budget.month,
            'amount': new_budget.amount
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding budget: {str(e)}'}), 500

@budgets_bp.route('/api/budgets/<int:id>', methods=['PUT'])
def update_budget(id):
    try:
        data = request.get_json()
        budget = Budget.query.get_or_404(id)
        budget.amount = data['amount']
        db.session.commit()
        return jsonify({
            'id': budget.id,
            'category_id': budget.category_id,
            'category_name': budget.category.name,
            'month': budget.month,
            'amount': budget.amount
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating budget: {str(e)}'}), 500

@budgets_bp.route('/api/budgets/<int:id>', methods=['DELETE'])
def delete_budget(id):
    try:
        budget = Budget.query.get_or_404(id)
        db.session.delete(budget)
        db.session.commit()
        return jsonify({'message': 'Budget deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting budget: {str(e)}'}), 500
    
# for the spending summary
@budgets_bp.route('/api/spending_summary', methods=['GET'])
def get_spending_summary():
    try:
        month = request.args.get('month')
        if not month:
            month = datetime.now().strftime('%Y-%m')

        year, month_num = map(int, month.split('-'))

        budgets = Budget.query.filter_by(month=month).all()
        total_budget = sum(b.amount for b in budgets)

        total_spent = 0
        for budget in budgets:
            spent = db.session.query(db.func.sum(Transaction.amount)).filter(
                Transaction.category_id == budget.category_id,
                Transaction.type == "Expense",
                extract('year', Transaction.date) == year,
                extract('month', Transaction.date) == month_num
            ).scalar() or 0
            total_spent += spent

        return jsonify({
            "month": f"{year}={month_num:02}",
            "total_budget": total_budget,
            "total_spent": total_spent,
            "remaining": round(total_budget - total_spent, 2)
        })

    except Exception as e:
        return jsonify({'message': f'Error generating spending summary: {str(e)}'}), 500



