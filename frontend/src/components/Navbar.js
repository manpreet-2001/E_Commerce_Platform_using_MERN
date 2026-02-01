import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Local Store
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
              About
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>
              Products
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
              Contact
            </Link>
          </li>
        </ul>

        <div className="nav-auth">
          <Link to="/login" className={`nav-auth-link ${location.pathname === '/login' ? 'active' : ''}`}>
            Login
          </Link>
          <Link to="/register" className={`nav-auth-link ${location.pathname === '/register' ? 'active' : ''}`}>
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
