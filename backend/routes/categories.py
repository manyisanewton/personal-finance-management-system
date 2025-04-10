from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from ..models import db, Category

categories_bp = Blueprint('categories', __name__)

# GET method to fetch all categories
@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([{'id': c.id, 'name': c.name} for c in categories])

# POST method to add a new category
@categories_bp.route('/api/categories', methods=['POST'])
def add_category():
    data = request.get_json()  # Get the data from the request body

    if not data or not data.get('name'):
        return jsonify({'message': 'Category name is required'}), 400

    new_category = Category(name=data['name'])

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
    
# DELETE method to remove a category by ID
@categories_bp.route('/api/categories/<int:id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404

    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Category deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting category: {str(e)}'}), 500

