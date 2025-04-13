from models import db, Category
from app import app

with app.app_context():
    db.drop_all()
    db.create_all()

    categories = [
        Category(name="Food"),
        Category(name="Rent"),
        Category(name="Salary"),
        Category(name="Entertainment"),
        Category(name="Transport"),
        Category(name="Bills"),
    ]
    db.session.add_all(categories)
    db.session.commit()
    print("Seeded categories!")