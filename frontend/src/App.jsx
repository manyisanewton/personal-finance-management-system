import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';

// Lazy load the route components
const Transactions = React.lazy(() => import('./components/Transactions'));
const Budget = React.lazy(() => import('./components/Budget'));
const Categories = React.lazy(() => import('./components/Categories'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const RegistrationPage = React.lazy(() => import('./components/RegistrationPage'));

import './App.css';
const AppLayout = () => {
//   const [isNavOpen, setIsNavOpen] = useState(false);
//   const location = useLocation();

//   const getRouteTitle = () => {
//     const path = location.pathname;
//     if (path === '/') return 'RegistrationPage';
//     if (path === '/budget') return 'Budget';
//     if (path === '/transactions') return 'Transactions';
//     if (path === '/categories') return 'Categories';
//     return '';
//   };

  return (
    <div className="app">
      {/* <Header routeTitle={getRouteTitle()} isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} /> */}
      <div className="main-content">
        {/* <Navbar isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} /> */}
        {/* {isNavOpen && <div className="navbar-overlay" onClick={() => setIsNavOpen(false)} />} */}
        <div className="page-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
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