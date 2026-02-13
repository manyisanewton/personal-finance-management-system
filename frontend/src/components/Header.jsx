import React from 'react';
import { FaBars ,FaSun,FaMoon} from 'react-icons/fa';
import './Header.css';
import {useTheme} from '../context/ThemeContext';
import RecurringNotifications from './RecurringNotifications';
import BudgetNotifications from './BudgetNotifications';

const Header = ({ routeTitle, isNavOpen, setIsNavOpen }) => {
    const{theme,toggleTheme}=useTheme();

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Finance Manager</h1>
        <span className="route-title">{routeTitle}</span>
      </div>
      <div className="header-right">
        <RecurringNotifications />
        <BudgetNotifications />
        <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <FaSun /> : <FaMoon />}
      </button>
      <button
        className="menu-toggle"
        onClick={() => setIsNavOpen(!isNavOpen)}
        aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
      >
        <FaBars />
      </button>
      </div>
    </header>
  );
};

export default Header;
