import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def _normalize_database_uri(db_url):
    if db_url.startswith("postgres://"):
        return db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    return db_url


def init_db(app):
    db_url = os.getenv('DATABASE_URL', 'sqlite:///finance.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = _normalize_database_uri(db_url)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
