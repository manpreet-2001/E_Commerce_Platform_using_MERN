import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="vendor-dashboard-page">
      <Navbar />

      <main className="vendor-dashboard-main">
        <div className="vendor-dashboard-container">
          <header className="vendor-dashboard-header">
            <h1 className="vendor-dashboard-title">Vendor Dashboard</h1>
            <p className="vendor-dashboard-subtitle">Manage your products and orders</p>
          </header>

          <div className="vendor-dashboard-tabs">
            <button
              type="button"
              className={`vendor-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              My Products
            </button>
            <button
              type="button"
              className={`vendor-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              My Orders
            </button>
          </div>

          <div className="vendor-dashboard-content">
            {activeTab === 'products' && (
              <div className="vendor-tab-panel">
                <div className="vendor-placeholder">
                  <p className="vendor-placeholder-title">My Products</p>
                  <p className="vendor-placeholder-text">Add, edit, and manage your product listings here.</p>
                  <p className="vendor-placeholder-note">(Product management coming soon)</p>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="vendor-tab-panel">
                <div className="vendor-placeholder">
                  <p className="vendor-placeholder-title">My Orders</p>
                  <p className="vendor-placeholder-text">View and update orders that include your products.</p>
                  <p className="vendor-placeholder-note">(Order management coming soon)</p>
                </div>
              </div>
            )}
          </div>

          <div className="vendor-dashboard-footer">
            <Link to="/products" className="vendor-back-link">← Back to Shop</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
