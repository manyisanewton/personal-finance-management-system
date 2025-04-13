from flask import Flask, render_template, redirect, url_for, request
from flask_cors import CORS
from flask_migrate import Migrate  # Import Migrate
from flask_login import LoginManager, login_user, login_required, current_user # Import LoginManager
from flask_bcrypt import Bcrypt # Import Flask-Bcrypt
from backend.models import db, User  # Your db setup
from backend.routes.transactions import transactions_bp
from backend.routes.categories import categories_bp
from backend.routes.auth import auth_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = '88YGEVSHYD7WJWJS'

# Initialization extension
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)  # Initialize LoginManager
login_manager.login_view = "auth.login"  # Set the login view
migrate = Migrate(app, db)  # Initialize Migrate instance with app and db

CORS(app, supports_credentials=True, resources={r'/*': {'origins': 'http://localhost:5173'}})  # Enable CORS for all routes

# register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(transactions_bp, url_prefix='/transactions')
app.register_blueprint(categories_bp, url_prefix='/categories')

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def home():
    return redirect(url_for('auth.login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)



if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # You can keep this, but Flask-Migrate should handle migrations
    app.run(debug=True)
