from flask import Blueprint, jsonify, request
from database import db
from models import Category

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([{'id': c.id, 'name': c.name} for c in categories])
    except Exception as e:
        return jsonify({'message': f'Error fetching categories: {str(e)}'}), 500

@categories_bp.route('/api/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    if not data or not data.get('name') or len(data['name'].strip()) < 1:
        return jsonify({'message': 'Valid category name is required'}), 400
    if len(data['name']) > 80:
        return jsonify({'message': 'Category name too long (max 80 characters)'}), 400
    new_category = Category(name=data['name'].strip())
    try:
        db.session.add(new_category)
        db.session.commit()
        return jsonify({
            'message': 'Category added successfully',
            'category': {'id': new_category.id, 'name': new_category.name}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding category: {str(e)}'}), 500

@categories_bp.route('/api/categories/<int:id>', methods=['PUT'])
def update_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    data = request.get_json()
    if not data or not data.get('name') or len(data['name'].strip()) < 1:
        return jsonify({'message': 'Valid category name is required'}), 400
    if len(data['name']) > 80:
        return jsonify({'message': 'Category name too long (max 80 characters)'}), 400
    try:
        category.name = data['name'].strip()
        db.session.commit()
        return jsonify({
            'message': 'Category updated successfully',
            'category': {'id': category.id, 'name': category.name}
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating category: {str(e)}'}), 500

@categories_bp.route('/api/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    if category.transactions:
        return jsonify({'message': 'Cannot delete category with transactions'}), 400
    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Category deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting category: {str(e)}'}), 500