import React, { useState, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import { useTheme } from './context/ThemeContext';
import './index.css';

//lazy load route components
const Transactions = React.lazy(() => import('./components/Transactions'));
const Budget = React.lazy(() => import('./components/Budget'));
const Categories = React.lazy(() => import('./components/Categories'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const RegistrationPage = React.lazy(() => import('./components/RegistrationPage'));
const CurrencyConverter = React.lazy(() => import('./components/CurrencyConverter'));

import './App.css';

const AppLayout = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // load registration page on initial load
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/register');
    }
  }, [location, navigate]);

  const getRouteTitle = () => {
    const path = location.pathname;
    if (path === '/register') return 'RegistrationPage';
    if (path === '/login') return 'LoginPage';
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/budget') return 'Budget';
    if (path === '/transactions') return 'Transactions';
    if (path === '/categories') return 'Categories';
    if (path === '/currency-converter') return 'Currency Converter';
    return '';
  };

  // condition for the navbar abd header not to show in the registration and login page
  const shouldShowNavbarAndHeader = location.pathname !== '/register' && location.pathname !== '/login';

  return (
    <div className={`app ${theme}`}>
      {shouldShowNavbarAndHeader && (
        <Header routeTitle={getRouteTitle()} isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
      )}
      <div className="main-content">
        {shouldShowNavbarAndHeader && (
          <>
            <Navbar isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
            <div className="navbar-overlay" onClick={() => setIsNavOpen(false)} />
          </>
        )}
        <div
          className="page-content"
          style={{
            marginLeft: shouldShowNavbarAndHeader ? '250px' : '0',
            marginTop: shouldShowNavbarAndHeader ? '60px' : '0'
          }}
        >
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/currency-converter" element={<CurrencyConverter />} />
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
