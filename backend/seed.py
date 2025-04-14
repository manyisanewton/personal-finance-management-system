from models import db, User, Category
from app import app, bcrypt
def seed_users():
    demo_user = User(
        username="demo",
        email="demo@example.com",
        password=bcrypt.generate_password_hash("123456").decode('utf-8')
    )
    db.session.add(demo_user)
    db.session.commit()
def seed_categories():
    categories = [
        Category(name="Food"),
        Category(name="Rent"),
        Category(name="Salary"),
        Category(name="Entertainment"),
        Category(name="Transport"),
        Category(name="Bills")
    ]
    db.session.add_all(categories)
    db.session.commit()
    print("Seeded categories!")
def seed_all():
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_categories()
        seed_users()
        print("Database seeded successfully!")
if __name__ == "__main__":
    seed_all()