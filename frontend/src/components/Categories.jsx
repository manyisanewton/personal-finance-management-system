import React, { useState, useEffect } from 'react';
import { FaTag } from 'react-icons/fa'; // 
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchCategories();
  }, [API_URL]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/categories`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to fetch categories: ${response.statusText}`);
      }
      const data = await response.json();
      setCategories(data);
      setError('');
    } catch (error) {
      setError(`Error fetching categories: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (newCategory.trim() === '') {
      setError('Category name cannot be empty');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to add category: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.message === 'Category added successfully') {
        setCategories([...categories, data.category]);
        setNewCategory('');
        setError('');
        setSuccess('Category added successfully');
      } else {
        throw new Error(data.message || 'Failed to add category');
      }
    } catch (error) {
      setError(`Error adding category: ${error.message}`);
      console.error(error);
    }
  };

  const handleEditStart = (category) => {
    setEditCategoryId(category.id);
    setEditName(category.name);
    setError('');
    setSuccess('');
  };

  const handleEditCancel = () => {
    setEditCategoryId(null);
    setEditName('');
  };

  const handleEditSave = async (id) => {
    if (editName.trim() === '') {
      setError('Category name cannot be empty');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to update category: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.message === 'Category updated successfully') {
        setCategories(
          categories.map((cat) =>
            cat.id === id ? data.category : cat
          )
        );
        setEditCategoryId(null);
        setEditName('');
        setError('');
        setSuccess('Category updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update category');
      }
    } catch (error) {
      setError(`Error updating category: ${error.message}`);
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      // First, fetch and delete associated transactions
      const transactionsResponse = await fetch(`${API_URL}/api/transactions?category_id=${id}`, { method: 'GET' });
      if (!transactionsResponse.ok) {
        const err = await transactionsResponse.json();
        throw new Error(err.message || `Failed to fetch transactions: ${transactionsResponse.statusText}`);
      }
      const transactions = await transactionsResponse.json();
      const deletePromises = transactions.map((transaction) =>
        fetch(`${API_URL}/api/transactions/${transaction.id}`, {
          method: 'DELETE',
        }).then((response) => {
          if (!response.ok) {
            return response.json().then((err) => {
              throw new Error(err.message || `Failed to delete transaction: ${response.statusText}`);
            });
          }
          return response.json();
        })
      );
      await Promise.all(deletePromises);

      // Now delete the category
      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to delete category: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.message === 'Category deleted successfully') {
        setCategories(categories.filter((cat) => cat.id !== id));
        setError('');
        setSuccess('Category deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete category');
      }
    } catch (error) {
      setError(`Error deleting category: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="categories-page">
      <h2>Manage Categories</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="category-form-section">
        <h3>Add New Category</h3>
        <form onSubmit={handleAddCategory} className="category-form">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            aria-label="New category name"
          />
          <button type="submit">Add Category</button>
        </form>
      </div>
      <div className="categories-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : categories.length === 0 ? (
          <p className="no-categories">No categories found</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-item">
              {editCategoryId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Edit category name"
                  />
                  <div className="category-actions">
                    <button onClick={() => handleEditSave(category.id)}>Save</button>
                    <button onClick={handleEditCancel}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="category-name">
                    <FaTag className="category-icon" />
                    <span>{category.name}</span>
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={() => handleEditStart(category)}
                      className="edit-button"
                      data-tooltip="Edit this category"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="delete-button"
                      data-tooltip="Delete this category"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;