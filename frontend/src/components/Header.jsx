import React from 'react';
import { FaBars } from 'react-icons/fa';
import './Header.css';

const Header = ({ routeTitle, isNavOpen, setIsNavOpen }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Finance Manager</h1>
        <span className="route-title">{routeTitle}</span>
      </div>
      <button
        className="menu-toggle"
        onClick={() => setIsNavOpen(!isNavOpen)}
        aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
      >
        <FaBars />
      </button>
    </header>
  );
};

export default Header;