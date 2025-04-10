from backend.models import db, Category, Transaction  # Import Transaction model
from backend.app import app  # Correct import for app

categories = ['Food', 'Rent', 'Salary', 'Entertainment', 'Transport']

transactions = [
    {"title": "Grocery Shopping", "amount": 45.89, "type": "Expense", "date": "2025-04-09", "category_name": "Food"},
    {"title": "Electricity Bill", "amount": 120.50, "type": "Expense", "date": "2025-04-05", "category_name": "Bills"},
    {"title": "Monthly Rent", "amount": 850.00, "type": "Expense", "date": "2025-04-01", "category_name": "Rent"},
    {"title": "Salary Payment", "amount": 2500.00, "type": "Income", "date": "2025-03-31", "category_name": "Salary"},
    {"title": "Movie Night", "amount": 15.75, "type": "Expense", "date": "2025-03-28", "category_name": "Entertainment"},
]

with app.app_context():
    db.drop_all()  # Drop all existing tables
    db.create_all()  # Create new tables

    # Seed categories
    for name in categories:
        category = Category(name=name)
        db.session.add(category)
    db.session.commit()
    print("Seeded categories!")

    # Seed transactions
    for transaction in transactions:
        category = Category.query.filter_by(name=transaction["category_name"]).first()  # Get category by name
        if category:  # Ensure category exists
            transaction_obj = Transaction(
                title=transaction["title"],
                amount=transaction["amount"],
                type=transaction["type"],
                date=transaction["date"],
                category_id=category.id  # Link to the correct category
            )
            db.session.add(transaction_obj)
    db.session.commit()
    print("Seeded transactions!")
