import React, { useState, useEffect } from 'react';
import TransactionCard from '../components/TransactionCard.jsx';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]); // State to hold categories
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category_id: '', // Ensure this is category_id
    date: '',
    type: '', // Added type field
  });

  useEffect(() => {
    // Fetch transactions
    fetch('http://localhost:5000/api/transactions')
      .then((response) => response.json())
      .then((data) => setTransactions(data));

    // Fetch categories
    fetch('http://localhost:5000/api/categories')
      .then((response) => response.json())
      .then((data) => setCategories(data)); // Assuming your categories are fetched from an endpoint
  }, []);

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/transactions/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      })
      .catch((error) => console.error('Delete failed:', error));
  };

  // When editing, also set the type value
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: transaction.amount,
      category_id: transaction.category_id || '',
      date: transaction.date,
      type: transaction.type || '',  // Set the type field
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category_id || !formData.date || !formData.type) {
      alert("All fields are required");
      return;
    }

    const updatedTransaction = {
      ...editingTransaction,
      ...formData,
    };

    fetch(`http://localhost:5000/api/transactions/${editingTransaction.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedTransaction),
    })
      .then((response) => response.json())
      .then((data) => {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === data.id ? { ...tx, ...data } : tx))
        );
        setEditingTransaction(null);
        setFormData({
          title: '',
          amount: '',
          category_id: '',
          date: '',
          type: '',  // Reset type correctly
        });
      })
      .catch((error) => console.error('Error updating transaction:', error));
  };

  return (
    <div className="transactions-container">
      <h2 className="section-title">Transactions</h2>
      <div className="transactions-list">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editingTransaction && (
        <div className="edit-modal">
          <h3>Edit Transaction</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
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
            <div>
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange} required>
                <option value="">Select Type</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div className="transaction-buttons">
              <button type="submit" className="save-btn">Save Changes</button>
              <button type="button" onClick={() => setEditingTransaction(null)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Transactions;
