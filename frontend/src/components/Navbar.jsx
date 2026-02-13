import './Navbar.css';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartBar, FaWallet, FaExchangeAlt, FaList, FaSignOutAlt, FaMoneyBillWave, FaRedoAlt, FaUniversity } from 'react-icons/fa';
import { motion } from 'framer-motion';
import "./Navbar.css"

const Navbar = ({ isNavOpen, setIsNavOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsNavOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        console.log('Logout successful');
        navigate('/login');
      } else {
        console.error('Logout failed:', response.status);
      }
    } catch (error) {
      console.error('Error while logging out:', error);
    }
  };
  const navbarVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  };
  const shouldAnimate = window.innerWidth <= 768;
  return (
    <motion.nav
      className="navbar"
      initial={shouldAnimate ? 'hidden' : 'visible'}
      animate={shouldAnimate ? (isNavOpen ? 'visible' : 'hidden') : 'visible'}
      variants={navbarVariants}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <ul>
        <li>
          <Link
            to="/dashboard"
            className={location.pathname === '/dashboard' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaChartBar /> Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/budget"
            className={location.pathname === '/budget' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaWallet /> Budget
          </Link>
        </li>
        <li>
          <Link
            to="/transactions"
            className={location.pathname === '/transactions' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaExchangeAlt /> Transactions
          </Link>
        </li>
        <li>
          <Link
            to="/accounts"
            className={location.pathname === '/accounts' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaUniversity /> Accounts
          </Link>
        </li>
        <li>
          <Link
            to="/recurring"
            className={location.pathname === '/recurring' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaRedoAlt /> Recurring
          </Link>
        </li>
        <li>
          <Link
            to="/categories"
            className={location.pathname === '/categories' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaList /> Categories
          </Link>
        </li>
        <li>
          <Link
            to="/currency-converter"
            className={location.pathname === '/currency-converter' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaMoneyBillWave /> Currency Converter
          </Link>
        </li>
        <li className='logout-button'>
          <button onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </li>
      </ul>
    </motion.nav>
  );
};
export default Navbar;
