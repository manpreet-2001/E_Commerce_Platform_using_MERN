import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useOrderNotification } from '../context/OrderNotificationContext';
import { ROUTES } from '../constants/routes';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { hasUnseenOrderUpdates } = useOrderNotification();
  const isVendor = isAuthenticated() && hasRole(['vendor']);
  const isAdmin = isAuthenticated() && hasRole(['admin']);
  const isCustomer = isAuthenticated() && !isVendor && !isAdmin;
  const showHamburger = isAuthenticated();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    if (q) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(q)}`);
      setSearchQuery('');
    } else {
      navigate(ROUTES.PRODUCTS);
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate(ROUTES.HOME);
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
              <Link to={ROUTES.HOME} className={`nav-link ${location.pathname === ROUTES.HOME ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to={ROUTES.PRODUCTS} className={`nav-link ${location.pathname.startsWith(ROUTES.PRODUCTS) ? 'active' : ''}`}>
                Shop
              </Link>
            </li>
            {!isVendor && !isAdmin && (
              <>
                <li className="nav-item">
                  <Link to={ROUTES.ABOUT} className={`nav-link ${location.pathname === ROUTES.ABOUT ? 'active' : ''}`}>
                    About
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to={ROUTES.CONTACT} className={`nav-link ${location.pathname === ROUTES.CONTACT ? 'active' : ''}`}>
                    Contact
                  </Link>
                </li>
              </>
            )}
            {isVendor && (
              <li className="nav-item">
                <Link to={ROUTES.VENDOR_DASHBOARD} className={`nav-link ${location.pathname === ROUTES.VENDOR_DASHBOARD ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <Link to={ROUTES.ADMIN_DASHBOARD} className={`nav-link ${location.pathname === ROUTES.ADMIN_DASHBOARD ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
            )}
            {isCustomer && (
              <li className="nav-item">
                <Link to={ROUTES.ORDERS} className={`nav-link nav-link-orders ${location.pathname.startsWith(ROUTES.ORDERS) ? 'active' : ''}`}>
                  My Orders
                  {hasUnseenOrderUpdates && (
                    <span className="nav-orders-dot" aria-label="Order status updated" title="Order status updated" />
                  )}
                </Link>
              </li>
            )}
          </ul>

          <form className="nav-search-form" onSubmit={handleSearchSubmit} role="search">
            <label htmlFor="nav-search-input" className="nav-search-label">Search</label>
            <div className="nav-search-wrap">
              <input
                id="nav-search-input"
                type="search"
                className="nav-search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" className="nav-search-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </form>

          <div className="nav-actions">
            {isAuthenticated() && (
              <Link to={ROUTES.CART} className="nav-cart-link" aria-label={`Cart, ${cartCount} items`}>
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
            {isAuthenticated() && (
              <Link
                to={ROUTES.WISHLIST}
                className="nav-cart-link nav-wishlist-link"
                aria-label={`Wishlist, ${wishlistCount || 0} items`}
                title="Wishlist"
              >
                <span className="nav-cart-icon" aria-hidden="true">♥</span>
                <span className="nav-wishlist-text">Wishlist</span>
                {(wishlistCount || 0) > 0 && (
                  <span className="nav-cart-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>
                )}
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
                      aria-label={isVendor ? 'User menu (Dashboard, Logout)' : isAdmin ? 'User menu (Dashboard, Logout)' : 'User menu (Profile, Orders, Logout)'}
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
                          <Link to={ROUTES.PROFILE} className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            Profile
                          </Link>
                        )}
                        {isCustomer && (
                          <Link to={ROUTES.ORDERS} className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            My Orders
                          </Link>
                        )}
                        {isVendor && (
                          <Link to={ROUTES.VENDOR_DASHBOARD} className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                            Dashboard
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to={ROUTES.ADMIN_DASHBOARD} className="nav-user-dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
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
                <Link to={ROUTES.LOGIN} className={`nav-auth-link ${location.pathname === ROUTES.LOGIN ? 'active' : ''}`}>
                  Sign In
                </Link>
                <Link to={ROUTES.REGISTER} className="nav-register-btn">
                  Create Account
                </Link>
                <Link to={ROUTES.ADMIN_DASHBOARD} className="nav-admin-link" title="Admin sign in">
                  Admin
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
