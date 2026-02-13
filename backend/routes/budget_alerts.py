from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import extract

from models import db, Budget, BudgetAlert, Category, Transaction

budget_alerts_bp = Blueprint('budget_alerts', __name__)


def _parse_thresholds(value):
    if isinstance(value, list):
        raw = value
    else:
        raw = [item.strip() for item in str(value or '').split(',') if item.strip()]

    thresholds = []
    for item in raw:
        try:
            number = int(item)
        except (TypeError, ValueError):
            continue
        if 1 <= number <= 100:
            thresholds.append(number)

    if not thresholds:
        thresholds = [50, 75, 90, 100]

    return sorted(set(thresholds))


def _total_spent_for_budget(budget):
    try:
        year, month_num = map(int, budget.month.split('-'))
    except (TypeError, ValueError):
        return 0

    total_spent = db.session.query(db.func.coalesce(db.func.sum(Transaction.amount), 0)).filter(
        Transaction.category_id == budget.category_id,
        Transaction.type == 'Expense',
        Transaction.is_transfer.is_(False),
        extract('year', Transaction.date) == year,
        extract('month', Transaction.date) == month_num
    ).scalar()
    return total_spent or 0


def create_budget_alerts_for_budget(budget, user_id=None):
    if not budget or budget.amount <= 0:
        return []

    total_spent = _total_spent_for_budget(budget)
    percent_used = (total_spent / budget.amount) * 100
    thresholds = _parse_thresholds(budget.alert_thresholds)

    created = []
    for threshold in thresholds:
        if percent_used < threshold:
            continue

        existing = BudgetAlert.query.filter_by(
            budget_id=budget.id,
            month=budget.month,
            threshold=threshold
        ).first()
        if existing:
            continue

        alert = BudgetAlert(
            user_id=user_id,
            budget_id=budget.id,
            category_id=budget.category_id,
            month=budget.month,
            threshold=threshold,
            percent_used=round(percent_used, 2),
            total_spent=round(total_spent, 2),
            created_at=datetime.utcnow(),
            is_read=False,
        )
        db.session.add(alert)
        created.append(alert)

    if created:
        db.session.commit()

    return created


@budget_alerts_bp.route('/api/budget_alerts', methods=['GET'])
@login_required
def list_budget_alerts():
    limit = request.args.get('limit', 10)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    try:
        limit = max(1, min(int(limit), 50))
    except (TypeError, ValueError):
        limit = 10

    query = BudgetAlert.query.filter_by(user_id=current_user.id)
    if unread_only:
        query = query.filter(BudgetAlert.is_read.is_(False))

    alerts = query.order_by(BudgetAlert.created_at.desc()).limit(limit).all()
    unread_count = BudgetAlert.query.filter_by(user_id=current_user.id, is_read=False).count()

    response = []
    for alert in alerts:
        category = alert.category
        budget = alert.budget
        response.append({
            'id': alert.id,
            'month': alert.month,
            'threshold': alert.threshold,
            'percent_used': alert.percent_used,
            'total_spent': alert.total_spent,
            'created_at': alert.created_at.isoformat(),
            'is_read': alert.is_read,
            'category': {
                'id': category.id,
                'name': category.name,
            } if category else None,
            'budget': {
                'id': budget.id,
                'amount': budget.amount,
            } if budget else None,
        })

    return jsonify({'alerts': response, 'unread_count': unread_count}), 200


@budget_alerts_bp.route('/api/budget_alerts/<int:alert_id>/read', methods=['POST'])
@login_required
def mark_budget_alert_read(alert_id):
    alert = BudgetAlert.query.filter_by(id=alert_id, user_id=current_user.id).first_or_404()
    alert.is_read = True
    db.session.commit()
    return jsonify({'message': 'Alert marked as read'}), 200


@budget_alerts_bp.route('/api/budget_alerts/read_all', methods=['POST'])
@login_required
def mark_all_budget_alerts_read():
    BudgetAlert.query.filter_by(user_id=current_user.id, is_read=False).update({
        'is_read': True
    })
    db.session.commit()
    return jsonify({'message': 'All alerts marked as read'}), 200
