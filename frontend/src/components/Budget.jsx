import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import './Budget.css';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [form, setForm] = useState({
    id: null,
    category_id: '',
    month: new Date().toISOString().slice(0, 7), 
    amount: '',
    alert_thresholds: [50, 75, 90, 100],
  });
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const defaultThresholds = [50, 75, 90, 100];

  // In-memory cache for API responses
  const cache = useRef(new Map());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
    fetchSpending();
  }, [monthFilter, API_URL]);

  const fetchCategories = async () => {
    const cacheKey = 'categories';
    if (cache.current.has(cacheKey)) {
      setCategories(cache.current.get(cacheKey));
      return;
    }

    try {
      console.log('Fetching categories from:', `${API_URL}/api/categories`);
      const response = await fetch(`${API_URL}/api/categories`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to fetch categories: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Categories fetched:', data);
      setCategories(data);
      cache.current.set(cacheKey, data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error fetching categories: ${error.message}`,
      });
      console.error('Fetch categories error:', error);
    }
  };

  const fetchBudgets = async () => {
    const cacheKey = `budgets_${monthFilter}`;
    if (cache.current.has(cacheKey)) {
      setBudgets(cache.current.get(cacheKey));
      return;
    }

    setLoading(true);
    try {
      const url = `${API_URL}/api/budgets?month=${monthFilter}`;
      console.log('Fetching budgets from:', url);
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to fetch budgets: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Budgets fetched:', data);
      setBudgets(data);
      cache.current.set(cacheKey, data);

      // Checks for budget limits
      data.forEach((budget) => {
        const categorySpending = spending[budget.category_id] || 0;
        if (categorySpending > budget.amount) {
          Swal.fire({
            icon: 'warning',
            title: 'Budget Exceeded',
            text: `You have exceeded your budget of ${budget.amount} for category '${budget.category_name}' this month. Total spending: ${categorySpending}.`,
          });
        }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error fetching budgets: ${error.message}`,
      });
      console.error('Fetch budgets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpending = async () => {
    const cacheKey = `spending_${monthFilter}`;
    if (cache.current.has(cacheKey)) {
      setSpending(cache.current.get(cacheKey));
      return;
    }

    try {
      const url = `${API_URL}/api/transactions?month=${monthFilter.slice(5, 7)}&year=${monthFilter.slice(0, 4)}&type=Expense`;
      console.log('Fetching spending from:', url);
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to fetch transactions: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Transactions fetched for spending:', data);
      const spendingByCategory = {};
      data.transactions.forEach((transaction) => {
        if (transaction.category_id) {
          spendingByCategory[transaction.category_id] = (spendingByCategory[transaction.category_id] || 0) + transaction.amount;
        }
      });
      console.log('Spending by category:', spendingByCategory);
      setSpending(spendingByCategory);
      cache.current.set(cacheKey, spendingByCategory);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error fetching spending data: ${error.message}`,
      });
      console.error('Fetch spending error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleThresholdToggle = (value) => {
    setForm((prev) => {
      const thresholds = prev.alert_thresholds || [];
      const exists = thresholds.includes(value);
      const next = exists ? thresholds.filter((item) => item !== value) : [...thresholds, value];
      return { ...prev, alert_thresholds: next.sort((a, b) => a - b) };
    });
  };

  const handleMonthFilterChange = (e) => {
    setMonthFilter(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select a category',
      });
      return;
    }
    if (!form.month) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Month is required',
      });
      return;
    }
    if (!form.amount || form.amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Budget amount must be a positive number',
      });
      return;
    }

    setFormLoading(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${API_URL}/api/budgets/${form.id}` : `${API_URL}/api/budgets`;
      const payload = {
        category_id: parseInt(form.category_id),
        month: form.month,
        amount: parseFloat(form.amount),
        alert_thresholds: form.alert_thresholds && form.alert_thresholds.length ? form.alert_thresholds : defaultThresholds,
      };
      console.log('Submitting budget to:', url);
      console.log('Payload:', payload);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to save budget: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Budget saved:', data);
      if (form.id) {
        setBudgets(budgets.map((b) => (b.id === form.id ? data : b)));
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Budget updated successfully',
        });
      } else {
        setBudgets([...budgets, data]);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Budget added successfully',
        });
      }
      setForm({
        id: null,
        category_id: '',
        month: new Date().toISOString().slice(0, 7),
        amount: '',
        alert_thresholds: defaultThresholds,
      });
      fetchBudgets(); // Refresh budgets
      fetchSpending(); // Refresh the spending to check for budget limits
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error saving budget: ${error.message}`,
      });
      console.error('Save budget error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (budget) => {
    setForm({
      id: budget.id,
      category_id: budget.category_id,
      month: budget.month,
      amount: budget.amount,
      alert_thresholds: budget.alert_thresholds && budget.alert_thresholds.length ? budget.alert_thresholds : defaultThresholds,
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4a90e2',
      cancelButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const url = `${API_URL}/api/budgets/${id}`;
        console.log('Deleting budget from:', url);
        const response = await fetch(url, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || `Failed to delete budget: ${response.status} ${response.statusText}`);
        }
        setBudgets(budgets.filter((b) => b.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Budget has been deleted.',
        });
        fetchSpending(); // It Refreshes spending to check for budget limits
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Error deleting budget: ${error.message}`,
        });
        console.error('Delete budget error:', error);
      }
    }
  };

  return (
    <section className="budget-page" aria-labelledby="budget-heading">
      <h2 id="budget-heading">Budget Management</h2>
      <motion.div
        className="budget-form-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3>{form.id ? 'Edit Budget' : 'Set New Budget'}</h3>
        <form onSubmit={handleSubmit} className="budget-form">
          <div className="form-group">
            <label htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleInputChange}
              aria-label="Select budget category"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="month">Month</label>
            <input
              id="month"
              type="month"
              name="month"
              value={form.month}
              onChange={handleInputChange}
              aria-label="Select budget month"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Budget Amount</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleInputChange}
              placeholder="Budget Amount"
              aria-label="Enter budget amount"
              step="0.01"
              required
            />
          </div>
          <div className="form-group thresholds">
            <label>Alert Thresholds</label>
            <div className="threshold-options">
              {defaultThresholds.map((threshold) => (
                <label key={threshold} className="threshold-option">
                  <input
                    type="checkbox"
                    checked={form.alert_thresholds?.includes(threshold)}
                    onChange={() => handleThresholdToggle(threshold)}
                  />
                  {threshold}%
                </label>
              ))}
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={formLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {formLoading ? 'Saving...' : form.id ? 'Update Budget' : 'Set Budget'}
          </motion.button>
        </form>
      </motion.div>
      <motion.div
        className="budget-filter"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <label htmlFor="month-filter">Filter by Month</label>
        <input
          id="month-filter"
          type="month"
          value={monthFilter}
          onChange={handleMonthFilterChange}
          aria-label="Filter budgets by month"
        />
      </motion.div>
      <div className="budget-list">
        {loading ? (
          <motion.div
            className="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Loading...
          </motion.div>
        ) : budgets.length === 0 ? (
          <motion.p
            className="no-budgets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            No budgets set for this month
          </motion.p>
        ) : (
          <AnimatePresence>
            {budgets.map((budget) => {
              const categorySpending = spending[budget.category_id] || 0;
              const percentage = (categorySpending / budget.amount) * 100;
              const isOverBudget = categorySpending > budget.amount;
              return (
                <motion.article
                  key={budget.id}
                  className="budget-item"
                  aria-labelledby={`budget-${budget.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 id={`budget-${budget.id}`}>{budget.category_name}</h4>
                  <p>Budget: {budget.amount}</p>
                  <p>Spending: {categorySpending}</p>
                  <div className="progress-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
                    <div
                      className={`progress-fill ${isOverBudget ? 'over-budget' : percentage > 80 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p>{percentage.toFixed(2)}% of budget used</p>
                  {isOverBudget && (
                    <p className="budget-warning" role="alert">
                      Warning: Budget exceeded!
                    </p>
                  )}
                  <div className="budget-actions">
                    <motion.button
                      onClick={() => handleEdit(budget)}
                      aria-label={`Edit budget for ${budget.category_name}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(budget.id)}
                      aria-label={`Delete budget for ${budget.category_name}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default Budget;
