import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { cartCount } = useCart();
  const isVendorOrAdmin = isAuthenticated() && hasRole(['vendor', 'admin']);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar-wrapper">
      {/* Promo bar */}
      <div className="navbar-promo">
        <p className="navbar-promo-text">Free shipping on orders over $50 • Easy returns</p>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          <Logo asLink={true} size="small" className="navbar-logo" />

          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>
                Shop
              </Link>
            </li>
            {!isVendorOrAdmin && (
              <>
                <li className="nav-item">
                  <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                    About
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
                    Contact
                  </Link>
                </li>
              </>
            )}
            {isVendorOrAdmin && (
              <li className="nav-item">
                <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
            )}
            {isAuthenticated() && !isVendorOrAdmin && (
              <li className="nav-item">
                <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>
                  My Orders
                </Link>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            {isAuthenticated() && (
              <Link to="/cart" className="nav-cart-link" aria-label={`Cart, ${cartCount} items`}>
                <span className="nav-cart-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </span>
                {cartCount > 0 && <span className="nav-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
              </Link>
            )}
            {isAuthenticated() ? (
              <>
                {isVendorOrAdmin && (
                  <span className="nav-role-badge" title={user?.role}>
                    <span className="nav-role-dot" aria-hidden="true" />
                    <span className="nav-role-text">{user?.role === 'admin' ? 'Admin' : 'Vendor'}</span>
                  </span>
                )}
                <span className="nav-user">Hi, {user?.name?.split(' ')[0]}</span>
                <button type="button" onClick={handleLogout} className="nav-logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`nav-auth-link ${location.pathname === '/login' ? 'active' : ''}`}>
                  Sign In
                </Link>
                <Link to="/register" className="nav-register-btn">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
