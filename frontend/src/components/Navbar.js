import React, { useState, useRef, useEffect } from 'react';
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
  const isVendor = isAuthenticated() && hasRole(['vendor']);
  const isAdmin = isAuthenticated() && hasRole(['admin']);
  const isCustomer = isAuthenticated() && !isVendor && !isAdmin;
  const showHamburger = isAuthenticated();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  return (
    <header className="navbar-wrapper">
      {/* Promo bar */}
      <div className="navbar-promo">
        <p className="navbar-promo-text">Free shipping on orders over $50 • Easy returns</p>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          <Logo asLink={true} size="small" className="navbar-logo" />

          {/* Main nav: no Profile link — customers use hamburger menu, vendors use Dashboard → Vendor Profile */}
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
                {(isVendor || isAdmin) && (
                  <span className="nav-role-badge" title={user?.role}>
                    <span className="nav-role-dot" aria-hidden="true" />
                    <span className="nav-role-text">{isAdmin ? 'Admin' : 'Vendor'}</span>
                  </span>
                )}
                {showHamburger && (
                  <div className="nav-user-menu-wrap" ref={userMenuRef}>
                    <button
                      type="button"
                      className="nav-hamburger-btn"
                      onClick={() => setUserMenuOpen((o) => !o)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                      aria-label={isVendor ? 'User menu (Dashboard, Logout)' : isAdmin ? 'User menu (Admin, Logout)' : 'User menu (Profile, Orders, Logout)'}
                    >
                      <span className="nav-hamburger-icon" aria-hidden="true" title="Menu">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="12" x2="21" y2="12" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                      </span>
                      <span className="nav-hamburger-label">Hi, {user?.name?.split(' ')[0]}</span>
                      <span className="nav-hamburger-chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    {userMenuOpen && (
                      <div className="nav-user-dropdown" role="menu">
                        {isCustomer && (
                          <Link to="/profile" className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            Profile
                          </Link>
                        )}
                        {isCustomer && (
                          <Link to="/orders" className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            My Orders
                          </Link>
                        )}
                        {isVendor && (
                          <Link to="/dashboard" className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            Dashboard
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            Admin
                          </Link>
                        )}
                        <button type="button" className="nav-user-dropdown-item nav-user-dropdown-logout" role="menuitem" onClick={handleLogout}>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
