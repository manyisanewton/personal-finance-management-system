import React, { useState, useEffect } from 'react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error('Error fetching categories:', error));
  }, []);

  const handleInputChange = (e) => {
    setNewCategory(e.target.value);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();

    if (newCategory.trim() === '') return;

    fetch('http://localhost:5000/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Category added successfully') {
          setCategories((prev) => [...prev, data.category]);
          setNewCategory('');
        } else {
          console.error(data.message);
        }
      })
      .catch((error) => console.error('Error adding category:', error));
  };

  const handleDeleteCategory = (id) => {
    fetch(`http://localhost:5000/api/categories/${id}`, {
      method: 'DELETE',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Category deleted successfully') {
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
        } else {
          console.error(data.message);
        }
      })
      .catch((error) => console.error('Error deleting category:', error));
  };

  return (
    <div className="categories-container">
      <h2 className="section-title">Categories</h2>

      <form onSubmit={handleAddCategory} className="add-category-form">
        <input
          type="text"
          value={newCategory}
          onChange={handleInputChange}
          placeholder="Enter a new category"
          aria-label="New category name"
          className="category-input"
        />
        <button type="submit" className="add-category-button">Add</button>
      </form>

      <div className="categories-list">
        {categories.map((category) => (
          <div key={category.id} className="category-item">
            <p className="category-name">{category.name}</p>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="delete-button"
              aria-label={`Delete ${category.name}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
