import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChartBar, FaWallet, FaExchangeAlt, FaList } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = ({ isNavOpen, setIsNavOpen }) => {
  const location = useLocation();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsNavOpen(false);
    }
  };

  const navbarVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  };

  // Only animate on mobile (max-width: 768px)
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
            to="/"
            className={location.pathname === '/' ? 'active' : ''}
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
            to="/categories"
            className={location.pathname === '/categories' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FaList /> Categories
          </Link>
        </li>
      </ul>
    </motion.nav>
  );
};

export default Navbar;