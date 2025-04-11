import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartBar, FaWallet, FaExchangeAlt, FaListAlt } from 'react-icons/fa'; // Font Awesome icons
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-header">
        <h1>Finance Manager</h1>
        
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FaChartBar className="icon" /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/budget" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FaWallet className="icon" /> Budget
          </NavLink>
        </li>
        <li>
          <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FaExchangeAlt className="icon" /> Transactions
          </NavLink>
        </li>
        <li>
          <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FaListAlt className="icon" /> Categories
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;