import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import { useTheme } from './context/ThemeContext';
import './index.css';

// Lazy load the route components
const Transactions = React.lazy(() => import('./components/Transactions'));
const Budget = React.lazy(() => import('./components/Budget'));
const Categories = React.lazy(() => import('./components/Categories'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));

import './App.css';
const AppLayout = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const {theme} = useTheme();//added this line

  const getRouteTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/budget') return 'Budget';
    if (path === '/transactions') return 'Transactions';
    if (path === '/categories') return 'Categories';
    return '';
  };

  return (
    <div className={`app ${theme}`}>
      <Header routeTitle={getRouteTitle()} isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
      <div className="main-content">
        <Navbar isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
        {isNavOpen && <div className="navbar-overlay" onClick={() => setIsNavOpen(false)} />}
        <div className="page-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;