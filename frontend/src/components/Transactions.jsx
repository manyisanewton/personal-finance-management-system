import React, { useState, useEffect } from 'react';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    id: null,
    title: '',
    amount: '',
    type: 'Expense',
    date: new Date().toISOString().split('T')[0], // Default to today
    category_id: '',
  });
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    category_id: '',
    type: '',
    search: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const months = [
    { value: '', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });
  years.unshift({ value: '', label: 'All Years' });

  const types = [
    { value: '', label: 'All Types' },
    { value: 'Expense', label: 'Expense' },
    { value: 'Income', label: 'Income' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch(`${API_URL}/api/categories`, { method: 'GET' });
        if (!categoriesResponse.ok) {
          const err = await categoriesResponse.json();
          throw new Error(err.message || `Failed to fetch categories: ${categoriesResponse.statusText}`);
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch transactions with filters
        const params = new URLSearchParams();
        if (filters.month) params.append('month', filters.month);
        if (filters.year) params.append('year', filters.year);
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.type) params.append('type', filters.type);
        if (filters.search) params.append('search', filters.search);

        const transactionsResponse = await fetch(`${API_URL}/api/transactions?${params.toString()}`, { method: 'GET' });
        if (!transactionsResponse.ok) {
          const err = await transactionsResponse.json();
          throw new Error(err.message || `Failed to fetch transactions: ${transactionsResponse.statusText}`);
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);

        setError('');
      } catch (error) {
        setError('Failed to load transactions. Please try again.');
        console.error(error);
      }
    };

    fetchData();
  }, [filters, API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) {
      setError('Please fill in all required fields.');
      return;
    }
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id
      ? `${API_URL}/api/transactions/${form.id}`
      : `${API_URL}/api/transactions`;
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount),
          type: form.type,
          date: form.date,
          category_id: form.category_id ? parseInt(form.category_id) : null,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to save transaction: ${response.statusText}`);
      }
      const data = await response.json();
      if (form.id) {
        setTransactions(
          transactions.map((t) => (t.id === form.id ? data : t))
        );
      } else {
        setTransactions([...transactions, data]);
      }
      setForm({ id: null, title: '', amount: '', type: 'Expense', date: new Date().toISOString().split('T')[0], category_id: '' });
      setError('');
      setSuccess(form.id ? 'Transaction updated successfully' : 'Transaction added successfully');
    } catch (error) {
      setError(`Error saving transaction: ${error.message}`);
      console.error(error);
    }
  };

  const handleEdit = (transaction) => {
    setForm({
      id: transaction.id,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      category_id: transaction.category_id || '',
    });
    setError('');
    setSuccess('');
  };
  

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to delete transaction: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.message === 'Transaction deleted successfully') {
        setTransactions(transactions.filter((t) => t.id !== id));
        setError('');
        setSuccess('Transaction deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete transaction');
      }
    } catch (error) {
      setError(`Error deleting transaction: ${error.message}`);
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.type) params.append('type', filters.type);

      const response = await fetch(`${API_URL}/api/transactions/export?${params.toString()}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to export transactions: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Transactions exported successfully');
    } catch (error) {
      setError(`Error exporting transactions: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="transactions-container">
      <h2>Transactions</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="transaction-form-section">
        <h3>Add New Transaction</h3>
        <form onSubmit={handleSubmit} className="transaction-form">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder="Title"
            aria-label="Transaction title"
          />
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleInputChange}
            placeholder="Amount"
            aria-label="Transaction amount"
            step="0.01"
          />
          <select
            name="type"
            value={form.type}
            onChange={handleInputChange}
            aria-label="Transaction type"
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleInputChange}
            aria-label="Transaction category"
          >
            <option value="">Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleInputChange}
            aria-label="Transaction date"
          />
          <button type="submit">{form.id ? 'Update Transaction' : 'Add Transaction'}</button>
        </form>
      </div>
      <div className="filters">
        <select
          name="month"
          value={filters.month}
          onChange={handleFilterChange}
          aria-label="Filter by month"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <select
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          aria-label="Filter by year"
        >
          {years.map((year) => (
            <option key={year.value} value={year.value}>
              {year.label}
            </option>
          ))}
        </select>
        <select
          name="category_id"
          value={filters.category_id}
          onChange={handleFilterChange}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          aria-label="Filter by type"
        >
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by title..."
          aria-label="Search transactions"
        />
        <button onClick={handleExport} className="export-button">Export as CSV</button>
      </div>
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions found</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <span>{transaction.title}</span>
              <span>{transaction.amount} ({transaction.type})</span>
              <span>{transaction.date}</span>
              <span>{categories.find(cat => cat.id === transaction.category_id)?.name || 'No Category'}</span>
              <div className="transaction-actions">
                <button onClick={() => handleEdit(transaction)}>Edit</button>
                <button onClick={() => handleDelete(transaction.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions;