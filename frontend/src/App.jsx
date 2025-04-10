import React, { useState, useEffect } from 'react';
import './App.css';
import Transactions from './pages/Transactions.jsx';
import Categories from './components/Categories.jsx'; // Adjust the path if necessary


function App() {
  return (
    <div className="app-container">
      <header>
        <h1 className="app-title">Finance Tracker</h1>
      </header>
      <main>
        <Transactions />  {/* ✅ Now renders the correct TransactionCard version */}
        <Categories />    {/* Categories list */}

      </main>
    </div>
  );
}

export default App;
