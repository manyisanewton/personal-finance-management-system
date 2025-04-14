from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, login_required, current_user
from flask_bcrypt import Bcrypt
from models import db, User, Transaction
from routes.transactions import transactions_bp
from routes.categories import categories_bp
from routes.auth import auth_bp
from routes.category_routes import category_summary_bp
from routes.budgets import budgets_bp
from routes.currency_converter import currency_converter_bp
from routes.email_reminders import email_reminders_bp
from sqlalchemy import func
from scheduler import start_scheduler
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {
    "origins": "http://localhost:5173",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = '88YGEVSHYD7WJWJS'
app.config['EMAIL_HOST'] = 'sandbox.smtp.mailtrap.io'
app.config['EMAIL_PORT'] = 587
app.config['EMAIL_USER'] = '4a706559e64d11'
app.config['EMAIL_PASSWORD'] = '47a3ff4ad8bee2'
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "auth.login"
migrate = Migrate(app, db)
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(category_summary_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(budgets_bp)
app.register_blueprint(currency_converter_bp)
app.register_blueprint(email_reminders_bp)
@app.route('/')
def home():
    return redirect(url_for('auth.login'))
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)
@app.route('/api/balance_summary', methods=['GET'])
def get_balance_summary():
    total_income = db.session.query(func.sum(Transaction.amount)).filter_by(type='Income').scalar() or 0
    total_expense = db.session.query(func.sum(Transaction.amount)).filter_by(type='Expense').scalar() or 0
    balance = total_income - total_expense
    return jsonify({
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance
    }), 200
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        start_scheduler(app)
    app.run(debug=True, port=5001)