from flask import Blueprint, request, jsonify
from models import db, Category, Transaction
from sqlalchemy import func

category_summary_bp = Blueprint("category_summary_bp", __name__)


@category_summary_bp.route("/api/category_spending_summary", methods=["GET"])
def category_spending_summary():
    account_id = request.args.get('account_id')

    query = (
        db.session.query(
            Category.name,
            func.sum(Transaction.amount).label("total_spent")
        )
        .join(Transaction)
        .filter(Transaction.type == 'Expense')
        .filter(Transaction.is_transfer.is_(False))
    )

    if account_id:
        query = query.filter(Transaction.account_id == int(account_id))

    results = query.group_by(Category.name).all()

    summary = [
        {"name": name, "total_spent": float(total_spent)} for name, total_spent in results
    ]

    return jsonify(summary), 200
