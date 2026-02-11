import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './VendorDashboard.css';

const SIDEBAR_SECTIONS = [
  { id: 'products', label: 'My Products', icon: '📦' },
  { id: 'orders', label: 'My Orders', icon: '🛒' },
];

const VendorDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Vendor';

  return (
    <div className="vendor-dashboard-page">
      <Navbar />

      <div className="vendor-dashboard-layout">
        {/* Sidebar */}
        <aside className={`vendor-dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="vendor-sidebar-inner">
            <div className="vendor-sidebar-header">
              <h2 className="vendor-sidebar-title">Dashboard</h2>
              <button
                type="button"
                className="vendor-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="vendor-sidebar-user">
              <span className="vendor-sidebar-avatar" aria-hidden>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="vendor-sidebar-name">{displayName}</span>
            </div>

            <nav className="vendor-sidebar-nav">
              {SIDEBAR_SECTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`vendor-sidebar-item ${activeSection === id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="vendor-sidebar-item-icon">{icon}</span>
                  <span className="vendor-sidebar-item-label">{label}</span>
                </button>
              ))}
            </nav>

            <div className="vendor-sidebar-footer">
              <Link
                to="/products"
                className="vendor-sidebar-back"
                onClick={() => setSidebarOpen(false)}
              >
                ← Back to Shop
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay when sidebar open on mobile */}
        <button
          type="button"
          className={`vendor-dashboard-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />

        {/* Main content */}
        <main className="vendor-dashboard-main">
          <div className="vendor-main-inner">
            <button
              type="button"
              className="vendor-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <header className="vendor-main-header">
              <div>
                <h1 className="vendor-main-title">
                  {activeSection === 'products' ? 'My Products' : 'My Orders'}
                </h1>
                <p className="vendor-main-greeting">Hello, {displayName}</p>
              </div>
            </header>

            {/* Quick stats (placeholder) */}
            <div className="vendor-stats">
              <div className="vendor-stat-card">
                <span className="vendor-stat-value">0</span>
                <span className="vendor-stat-label">Products</span>
              </div>
              <div className="vendor-stat-card">
                <span className="vendor-stat-value">0</span>
                <span className="vendor-stat-label">Orders</span>
              </div>
            </div>

            <div className="vendor-dashboard-content">
              {activeSection === 'products' && (
                <div className="vendor-tab-panel">
                  <div className="vendor-placeholder">
                    <p className="vendor-placeholder-title">My Products</p>
                    <p className="vendor-placeholder-text">
                      Add, edit, and manage your product listings here.
                    </p>
                    <p className="vendor-placeholder-note">(Product management coming soon)</p>
                  </div>
                </div>
              )}

              {activeSection === 'orders' && (
                <div className="vendor-tab-panel">
                  <div className="vendor-placeholder">
                    <p className="vendor-placeholder-title">My Orders</p>
                    <p className="vendor-placeholder-text">
                      View and update orders that include your products.
                    </p>
                    <p className="vendor-placeholder-note">(Order management coming soon)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;
