import React from 'react';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
  return (
    <div className="transaction-item">
      <div className="transaction-details">
        <h2 className="transaction-title">{transaction.title}</h2>
        <p className="transaction-amount">Ksh {transaction.amount}</p>
        <p className="transaction-category">
          Category: {transaction.category || 'Uncategorized'}
        </p>
        <p className="transaction-date">{transaction.date}</p>
      </div>
      
      {/* UPDATED BUTTON STYLING */}
      <div className="transaction-buttons">
        <button onClick={() => onEdit(transaction)} className="edit-btn">
          Edit
        </button>
        <button onClick={() => onDelete(transaction.id)} className="delete-btn">
          Delete
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
