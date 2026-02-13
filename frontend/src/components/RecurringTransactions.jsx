import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import './RecurringTransactions.css';

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const RecurringTransactions = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const [recurrences, setRecurrences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    title: '',
    amount: '',
    type: 'Expense',
    category_id: '',
    account_id: '',
    frequency: 'monthly',
    next_date: new Date().toISOString().split('T')[0],
    end_date: '',
    remaining_occurrences: '',
    active: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchRecurrences();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load categories',
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/accounts`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load accounts',
      });
    }
  };

  const fetchRecurrences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/recurring_transactions`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch recurring transactions');
      }
      const data = await response.json();
      setRecurrences(data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load recurring transactions',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      title: '',
      amount: '',
      type: 'Expense',
      category_id: '',
      account_id: '',
      frequency: 'monthly',
      next_date: new Date().toISOString().split('T')[0],
      end_date: '',
      remaining_occurrences: '',
      active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Title is required' });
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Amount must be positive' });
      return;
    }
    if (!form.next_date) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Next date is required' });
      return;
    }

    setFormLoading(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id
        ? `${API_URL}/api/recurring_transactions/${form.id}`
        : `${API_URL}/api/recurring_transactions`;

      const payload = {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        type: form.type,
        category_id: form.category_id ? parseInt(form.category_id, 10) : null,
        account_id: form.account_id ? parseInt(form.account_id, 10) : null,
        frequency: form.frequency,
        next_date: form.next_date,
        end_date: form.end_date || null,
        remaining_occurrences: form.remaining_occurrences
          ? parseInt(form.remaining_occurrences, 10)
          : null,
        active: form.active,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save recurring transaction');
      }

      const saved = await response.json();
      if (form.id) {
        setRecurrences((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      } else {
        setRecurrences((prev) => [saved, ...prev]);
      }

      Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: form.id ? 'Recurring transaction updated.' : 'Recurring transaction created.',
      });
      resetForm();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save recurring transaction',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (recurrence) => {
    setForm({
      id: recurrence.id,
      title: recurrence.title,
      amount: recurrence.amount,
      type: recurrence.type,
      category_id: recurrence.category_id || '',
      account_id: recurrence.account_id || '',
      frequency: recurrence.frequency,
      next_date: recurrence.next_date || new Date().toISOString().split('T')[0],
      end_date: recurrence.end_date || '',
      remaining_occurrences: recurrence.remaining_occurrences || '',
      active: recurrence.active,
    });
  };

  const handleDelete = async (recurrenceId) => {
    const result = await Swal.fire({
      title: 'Delete recurring transaction?',
      text: 'This will stop future postings.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/recurring_transactions/${recurrenceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete recurring transaction');
      }
      setRecurrences((prev) => prev.filter((item) => item.id !== recurrenceId));
      Swal.fire({ icon: 'success', title: 'Deleted' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  const handleToggleActive = async (recurrence) => {
    try {
      const response = await fetch(`${API_URL}/api/recurring_transactions/${recurrence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !recurrence.active }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update status');
      }
      const updated = await response.json();
      setRecurrences((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  return (
    <section className="recurring-page" aria-labelledby="recurring-heading">
      <h2 id="recurring-heading">Recurring Transactions</h2>

      <div className="recurring-form-section">
        <h3>{form.id ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}</h3>
        <form className="recurring-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleInputChange}
              placeholder="Rent, Salary, Subscription"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleInputChange}
              step="0.01"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" value={form.type} onChange={handleInputChange}>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="account_id">Account</label>
            <select id="account_id" name="account_id" value={form.account_id} onChange={handleInputChange}>
              <option value="">No Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="category_id">Category</label>
            <select id="category_id" name="category_id" value={form.category_id} onChange={handleInputChange}>
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="frequency">Frequency</label>
            <select id="frequency" name="frequency" value={form.frequency} onChange={handleInputChange}>
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="next_date">Next Date</label>
            <input
              id="next_date"
              name="next_date"
              type="date"
              value={form.next_date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="end_date">End Date</label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <label htmlFor="remaining_occurrences">Occurrences Remaining</label>
            <input
              id="remaining_occurrences"
              name="remaining_occurrences"
              type="number"
              value={form.remaining_occurrences}
              onChange={handleInputChange}
              placeholder="Optional"
              min="1"
            />
          </div>
          <div className="form-row toggle-row">
            <label htmlFor="active">Active</label>
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : form.id ? 'Update' : 'Create'}
            </button>
            {form.id && (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="recurring-list">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : recurrences.length === 0 ? (
          <p className="empty">No recurring transactions yet.</p>
        ) : (
          recurrences.map((recurrence) => (
            <article key={recurrence.id} className="recurring-card">
              <div className="recurring-header">
                <div>
                  <h4>{recurrence.title}</h4>
                  <p className="meta">
                    {recurrence.type} • {recurrence.frequency} • Next: {recurrence.next_date}
                  </p>
                </div>
                <span className={`status ${recurrence.active ? 'active' : 'inactive'}`}>
                  {recurrence.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="recurring-details">
                <p>Amount: {recurrence.amount}</p>
                <p>Account: {accounts.find((a) => a.id === recurrence.account_id)?.name || 'None'}</p>
                <p>Category: {categories.find((c) => c.id === recurrence.category_id)?.name || 'None'}</p>
                <p>End Date: {recurrence.end_date || 'None'}</p>
                <p>Remaining: {recurrence.remaining_occurrences || 'Unlimited'}</p>
              </div>
              <div className="recurring-actions">
                <button onClick={() => handleEdit(recurrence)}>Edit</button>
                <button onClick={() => handleToggleActive(recurrence)}>
                  {recurrence.active ? 'Pause' : 'Resume'}
                </button>
                <button className="danger" onClick={() => handleDelete(recurrence.id)}>Delete</button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default RecurringTransactions;
