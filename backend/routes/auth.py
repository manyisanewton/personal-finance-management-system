from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from models import User, db
from flask import Flask
from flask_cors import CORS

auth_bp = Blueprint('auth', __name__)

bcrypt = Bcrypt()

# Registration route
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    # Check if all fields are provided
    if not username or not email or not password or not confirm_password:
        return jsonify({'error': 'All fields are required'}), 400

    # check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 409
    
    # check if email already exists
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({'message': 'Email already exists'}), 400
    
    # check if password and confirm password match
    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400
    
    # hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201
    

# Login route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    username = data.get('username')
    password = data.get('password')

    # Check if all fields are provided
    if not username or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    # Check if user exists
    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password, password):
        login_user(user)
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401
    
# username root
@auth_bp.route('/username', methods=['GET'])
@login_required
def get_username():
    return jsonify({'username': current_user.username}), 200

# logout route
@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200