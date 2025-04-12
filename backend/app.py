from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from database import db  
from routes.transactions import transactions_bp
from routes.categories import categories_bp
from routes.budgets import budgets_bp 

app = Flask(__name__)

CORS(app, resources={r"/api/*": {
    "origins": "http://localhost:5173",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

app.register_blueprint(transactions_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(budgets_bp)  

@app.route('/')
def home():
    return 'Finance Tracker Backend Running'

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)