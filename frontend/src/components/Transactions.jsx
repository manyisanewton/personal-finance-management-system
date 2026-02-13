 import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import { debounce } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    id: null,
    title: '',
    amount: '',
    type: 'Expense',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    account_id: '',
  });
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    category_id: '',
    account_id: '',
    type: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [sort, setSort] = useState({ field: 'date', order: 'desc' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [splitRows, setSplitRows] = useState([]);
  const [useSplits, setUseSplits] = useState(false);

  const cache = useRef(new Map());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchData();
  }, [filters, sort, page, API_URL]);

  const fetchCategories = async () => {
    const cacheKey = 'categories';
    if (cache.current.has(cacheKey)) {
      setCategories(cache.current.get(cacheKey));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/categories`, { method: 'GET', credentials: 'include' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to fetch categories: ${response.statusText}`);
      }
      const data = await response.json();
      setCategories(data);
      cache.current.set(cacheKey, data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error fetching categories: ${error.message}`,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    const cacheKey = 'accounts';
    if (cache.current.has(cacheKey)) {
      setAccounts(cache.current.get(cacheKey));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/accounts`, { method: 'GET', credentials: 'include' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to fetch accounts: ${response.statusText}`);
      }
      const data = await response.json();
      setAccounts(data);
      cache.current.set(cacheKey, data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error fetching accounts: ${error.message}`,
      });
      console.error(error);
    }
  };

  const fetchData = async () => {
    const cacheKey = `transactions_${JSON.stringify({ filters, sort, page })}`;
    if (cache.current.has(cacheKey)) {
      const cachedData = cache.current.get(cacheKey);
      setTransactions(cachedData.transactions || []);
      setTotalPages(cachedData.total_pages || 1);
      setTotalItems(cachedData.total_items || 0);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      params.append('page', page);
      params.append('per_page', itemsPerPage);
      params.append('sort_field', sort.field);
      params.append('sort_order', sort.order);

      const transactionsResponse = await fetch(`${API_URL}/api/transactions?${params.toString()}`, { method: 'GET', credentials: 'include' });
      if (!transactionsResponse.ok) {
        const err = await transactionsResponse.json();
        throw new Error(err.message || `Failed to fetch transactions: ${transactionsResponse.statusText}`);
      }
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);
      setTotalPages(transactionsData.total_pages || 1);
      setTotalItems(transactionsData.total_items || 0);
      cache.current.set(cacheKey, transactionsData);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load transactions. Please try again.',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSplitChange = (index, field, value) => {
    setSplitRows((prev) => prev.map((row, i) => (
      i === index ? { ...row, [field]: value } : row
    )));
  };

  const addSplitRow = () => {
    setSplitRows((prev) => [...prev, { category_id: '', amount: '', note: '' }]);
  };

  const removeSplitRow = (index) => {
    setSplitRows((prev) => prev.filter((_, i) => i != index));
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPage(1);
      setSelectedTransactions([]);
    }, 500),
    []
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'search') {
      debouncedSearch(value);
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
      setPage(1);
      setSelectedTransactions([]);
    }
  };

  const handleSortChange = (field) => {
    setSort({
      field,
      order: sort.field === field && sort.order === 'desc' ? 'asc' : 'desc',
    });
    setPage(1);
    setSelectedTransactions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Title is required',
      });
      return;
    }
    if (form.title.length > 120) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Title must be less than 120 characters',
      });
      return;
    }
    if (!form.amount || form.amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Amount must be a positive number',
      });
      return;
    }
    if (!form.date) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Date is required',
      });
      return;
    }

    if (useSplits) {
      const total = splitRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
      if (!splitRows.length) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Add at least one split row',
        });
        return;
      }
      if (Math.round(total * 100) !== Math.round(parseFloat(form.amount) * 100)) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Split total must equal transaction amount',
        });
        return;
      }
    }

    setFormLoading(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id
        ? `${API_URL}/api/transactions/${form.id}`
        : `${API_URL}/api/transactions`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount),
          type: form.type,
          date: form.date,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          account_id: form.account_id ? parseInt(form.account_id) : null,
          splits: useSplits ? splitRows.map((row) => ({
            category_id: row.category_id ? parseInt(row.category_id) : null,
            amount: parseFloat(row.amount),
            note: row.note || null,
          })) : [],
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
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Transaction updated successfully',
        });
      } else {
        setTransactions([...transactions, data]);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Transaction added successfully',
        });
        if (data.budget_exceeded) {
          Swal.fire({
            icon: 'warning',
            title: 'Budget Exceeded',
            text: data.budget_message || 'You have exceeded your budget for this category.',
          });
        }
      }
      setForm({ id: null, title: '', amount: '', type: 'Expense', date: new Date().toISOString().split('T')[0], category_id: '', account_id: '' });
      setSplitRows([]);
      setUseSplits(false);
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An unexpected error occurred while saving the transaction.',
      });
      console.error('Error saving transaction:', error);
    } finally {
      setFormLoading(false);
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
      account_id: transaction.account_id || '',
    });
    const splits = transaction.splits || [];
    setSplitRows(splits.map((split) => ({
      category_id: split.category_id || '',
      amount: split.amount || '',
      note: split.note || '',
    })));
    setUseSplits(splits.length > 0);
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
        setLoading(true);
        const response = await fetch(`${API_URL}/api/transactions/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || `Failed to delete transaction: ${response.statusText}`);
        }
        setTransactions(transactions.filter((t) => t.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Transaction has been deleted.',
        });
        fetchData();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Error deleting transaction: ${error.message}`,
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectTransaction = (id) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one transaction to delete',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedTransactions.length} transaction(s). This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4a90e2',
      cancelButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, delete them!',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/transactions/bulk_delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids: selectedTransactions }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to delete transactions');
        }
        setTransactions(transactions.filter((t) => !selectedTransactions.includes(t.id)));
        setSelectedTransactions([]);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Selected transactions have been deleted.',
        });
        fetchData();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Error deleting transactions: ${error.message}`,
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };


  const handleToggleCleared = async (transaction) => {
    const nextValue = !transaction.is_cleared;
    const dateValue = typeof transaction.date === 'string'
      ? transaction.date
      : new Date(transaction.date).toISOString().split('T')[0];

    try {
      const response = await fetch(`${API_URL}/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          date: dateValue,
          category_id: transaction.category_id,
          account_id: transaction.account_id,
          is_transfer: transaction.is_transfer,
          transfer_group_id: transaction.transfer_group_id,
          is_cleared: nextValue,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update cleared status');
      }
      const updated = await response.json();
      setTransactions((prev) => prev.map((item) => (
        item.id === transaction.id ? { ...item, is_cleared: updated.is_cleared } : item
      )));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update cleared status',
      });
    }
  };


  const handleDownloadInvoice = async (transaction) => {
    try {
      const response = await fetch(`${API_URL}/api/transactions/${transaction.id}/invoice`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${transaction.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to download invoice',
      });
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Title', 'Amount', 'Type', 'Date', 'Account', 'Category'],
      ...transactions.map((t) => [
        t.title,
        t.amount,
        t.type,
        t.date,
        accounts.find((acct) => acct.id === t.account_id)?.name || 'No Account',
        categories.find((cat) => cat.id === t.category_id)?.name || 'No Category',
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="transactions-page" aria-labelledby="transactions-heading">
      <motion.div
        className="transaction-form-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3>{form.id ? 'Edit Transaction' : 'Add New Transaction'}</h3>
        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-group">
            <label htmlFor="title"></label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              placeholder="Title"
              aria-label="Transaction title"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount"></label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleInputChange}
              placeholder="Amount"
              aria-label="Transaction amount"
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="type"></label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleInputChange}
              aria-label="Transaction type"
              required
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="account_id"></label>
            <select
              id="account_id"
              name="account_id"
              value={form.account_id}
              onChange={handleInputChange}
              aria-label="Transaction account"
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="category_id"></label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleInputChange}
              aria-label="Transaction category"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group split-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={useSplits}
                onChange={(e) => setUseSplits(e.target.checked)}
              />
              Split across categories
            </label>
          </div>
          {useSplits && (
            <div className="split-rows">
              {splitRows.map((row, index) => (
                <div className="split-row" key={`split-${index}`}>
                  <select
                    value={row.category_id}
                    onChange={(e) => handleSplitChange(index, 'category_id', e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Note"
                    value={row.note}
                    onChange={(e) => handleSplitChange(index, 'note', e.target.value)}
                  />
                  <button type="button" className="split-remove" onClick={() => removeSplitRow(index)}>-</button>
                </div>
              ))}
              <button type="button" className="split-add" onClick={addSplitRow}>+ Add Split</button>
            </div>
          )}
          <motion.button
          <div className="form-group">
            <label htmlFor="date"></label>
            <input
              id="date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleInputChange}
              aria-label="Transaction date"
              required
            />
          </div>
          <motion.button
            type="submit"
            disabled={formLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {formLoading ? 'Saving...' : form.id ? 'Update Transaction' : 'Add Transaction'}
          </motion.button>
        </form>
      </motion.div>
      <motion.div
        className="filters"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <select name="month" value={filters.month} onChange={handleFilterChange} aria-label="Filter by month">
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select name="year" value={filters.year} onChange={handleFilterChange} aria-label="Filter by year">
          <option value="">All Years</option>
          {Array.from({ length: 10 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
        <select
          name="account_id"
          value={filters.account_id}
          onChange={handleFilterChange}
          aria-label="Filter by account"
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
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
        <select name="type" value={filters.type} onChange={handleFilterChange} aria-label="Filter by type">
          <option value="">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by title..."
          aria-label="Search transactions"
        />
        <motion.button
          onClick={handleExportCSV}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Export as CSV
        </motion.button>
        <motion.button
          onClick={() => handleSortChange('date')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sort by Date {sort.field === 'date' ? (sort.order === 'desc' ? '↓' : '↑') : ''}
        </motion.button>
        <motion.button
          onClick={() => handleSortChange('amount')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sort by Amount {sort.field === 'amount' ? (sort.order === 'desc' ? '↓' : '↑') : ''}
        </motion.button>
      </motion.div>
      <div className="transactions-list">
        <div className="bulk-actions">
          <input
            type="checkbox"
            checked={selectedTransactions.length === transactions.length && transactions.length > 0}
            onChange={handleSelectAll}
            aria-label="Select all transactions"
          />
          <motion.button
            onClick={handleBulkDelete}
            disabled={selectedTransactions.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete Selected
          </motion.button>
        </div>
        {loading ? (
          <motion.div
            className="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Loading transactions...
          </motion.div>
        ) : transactions.length === 0 ? (
          <motion.p
            className="no-transactions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            No transactions found
          </motion.p>
        ) : (
          <AnimatePresence>
            {transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                className="transaction-item"
                role="row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="checkbox"
                  checked={selectedTransactions.includes(transaction.id)}
                  onChange={() => handleSelectTransaction(transaction.id)}
                  aria-label={`Select transaction ${transaction.title}`}
                />
                <span>{transaction.title}</span>
                <span>{transaction.amount} ({transaction.type})</span>
                <span>{transaction.date}</span>
                <span>{accounts.find((acct) => acct.id === transaction.account_id)?.name || 'No Account'}</span>
                <span>{categories.find((cat) => cat.id === transaction.category_id)?.name || 'No Category'}</span>
                {transaction.splits && transaction.splits.length > 0 && (
                  <div className="split-summary">
                    {transaction.splits.map((split) => (
                      <span key={split.id || `${transaction.id}-${split.category_id}`}>
                        {split.category_name || 'Category'}: {split.amount}
                      </span>
                    ))}
                  </div>
                )}
                <label className="cleared-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(transaction.is_cleared)}
                    onChange={() => handleToggleCleared(transaction)}
                    aria-label={`Mark ${transaction.title} as cleared`}
                  />
                  Cleared
                </label>
                <div className="transaction-actions">
                  <motion.button
                    onClick={() => handleEdit(transaction)}
                    aria-label={`Edit transaction ${transaction.title}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleDownloadInvoice(transaction)}
                    aria-label={`Download invoice for ${transaction.title}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Invoice
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(transaction.id)}
                    aria-label={`Delete transaction ${transaction.title}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      {totalPages > 1 && (
        <motion.div
          className="pagination"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Previous
          </motion.button>
          <span>
            Page {page} of {totalPages} (Total: {totalItems} items)
          </span>
          <motion.button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Next
          </motion.button>
        </motion.div>
      )}
    </section>
  );
};

export default Transactions;
