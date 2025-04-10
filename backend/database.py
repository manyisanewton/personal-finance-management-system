# backend/database.py

from flask_sqlalchemy import SQLAlchemy

# Initialize the database object
db = SQLAlchemy()

def init_db(app):
    # Configure the database URI (using SQLite in this example)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance_tracker.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
