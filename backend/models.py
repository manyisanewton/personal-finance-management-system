from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # Income or Expense
    date = db.Column(db.String, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))

    category = db.relationship("Category", backref="transactions")

# This code defines the database models for the finance tracking application using SQLAlchemy.
# It includes two models: Category and Transaction.
# The Category model represents different categories of transactions, with an ID and name.
# The Transaction model represents individual transactions, with fields for title, amount, type (income or expense), date, and a foreign key reference to the category.
# The relationship between Transaction and Category is established using a backref, allowing easy access to transactions associated with a category.
# The models are defined using SQLAlchemy's ORM capabilities, which allows for easy interaction with the database.
# The code also includes the necessary imports and configurations for the SQLAlchemy database.
# The models are structured to allow for easy expansion and modification, making it a good starting point for a finance tracking application.
# The models are defined in a separate file (models.py) to keep the code organized and maintainable.
# The SQLAlchemy instance is created and initialized, and the models are defined with appropriate fields and relationships.
# The code also includes the necessary imports and configurations for the SQLAlchemy database.
# The models are structured to allow for easy expansion and modification, making it a good starting point for a finance tracking application.
# The models are defined in a separate file (models.py) to keep the code organized and maintainable.
# The SQLAlchemy instance is created and initialized, and the models are defined with appropriate fields and relationships.
# The code also includes the necessary imports and configurations for the SQLAlchemy database.
