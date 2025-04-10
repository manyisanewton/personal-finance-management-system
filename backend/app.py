from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate  # Import Migrate
from backend.models import db  # Your db setup
from backend.routes.transactions import transactions_bp
from backend.routes.categories import categories_bp

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

migrate = Migrate(app, db)  # Initialize Migrate instance with app and db

app.register_blueprint(transactions_bp)
app.register_blueprint(categories_bp)

@app.route('/')
def home():
    return 'Finance Tracker Backend Running'

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # You can keep this, but Flask-Migrate should handle migrations
    app.run(debug=True)
