import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';

import Transactions from './pages/Transactions.jsx';
import Categories from './components/Categories.jsx'; // Adjust the path if necessary
import LoginPage from './components/LoginPage.jsx';
import RegistrationPage from './components/RegistrationPage.jsx'; // Adjust the path if necessary


function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header>
          <h1 className="app-title">Finance Tracker</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<RegistrationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
          </Routes>

        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
