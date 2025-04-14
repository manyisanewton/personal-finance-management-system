from flask import Blueprint, request, jsonify
from models import db, Category, Transaction
from sqlalchemy import func

category_summary_bp = Blueprint("category_summary_bp", __name__)

@category_summary_bp.route("/api/category_spending_summary", methods=["GET"])
def category_spending_summary():
    results = (
        db.session.query(
            Category.name,
            func.sum(Transaction.amount).label("total_spent")
        )
        .join(Transaction)
        .group_by(Category.name)
        .all()
    )
    
    summary = [
        {"name": name, "total_spent": float(total_spent)} for name, total_spent in results
    ]

    return jsonify(summary), 200