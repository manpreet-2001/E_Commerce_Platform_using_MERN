import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { computeVendorStats } from '../utils/vendorStats';
import './VendorDashboard.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'My Products' },
  { id: 'orders', label: 'My Orders' },
];

const VendorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('/api/products/vendor/mine');
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders/vendor/mine');
      setOrders(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchProducts(), fetchOrders()]);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProducts, fetchOrders]);

  const vendorStats = useMemo(
    () => computeVendorStats(products, orders),
    [products, orders]
  );

  const displayName = user?.name || user?.email?.split('@')[0] || 'Vendor';

  return (
    <div className="vendor-dashboard-page">
      <Navbar />
      <main className="vendor-dashboard-main">
        <div className="vendor-dashboard-inner">
          <header className="vendor-dashboard-header">
            <h1 className="vendor-dashboard-title">
              {activeTab === 'overview' ? 'Overview' : activeTab === 'products' ? 'My Products' : 'My Orders'}
            </h1>
            <p className="vendor-dashboard-greeting">Hello, {displayName}</p>
          </header>

          <nav className="vendor-dashboard-tabs" aria-label="Dashboard sections">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`vendor-dashboard-tab ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {error && <div className="vendor-dashboard-error">{error}</div>}

          {loading ? (
            <div className="vendor-dashboard-loading">Loading…</div>
          ) : (
            <>
              <div className="vendor-stats">
                {activeTab === 'overview' ? (
                  <>
                    <div className="vendor-stat-card">
                      <span className="vendor-stat-value">{vendorStats.totalProducts}</span>
                      <span className="vendor-stat-label">Products</span>
                    </div>
                    <div className="vendor-stat-card">
                      <span className="vendor-stat-value">{vendorStats.totalOrders}</span>
                      <span className="vendor-stat-label">Orders</span>
                    </div>
                    <div className="vendor-stat-card">
                      <span className="vendor-stat-value">{formatPrice(vendorStats.totalRevenue)}</span>
                      <span className="vendor-stat-label">Revenue</span>
                    </div>
                    <div className="vendor-stat-card">
                      <span className="vendor-stat-value">{vendorStats.pendingOrders}</span>
                      <span className="vendor-stat-label">Pending</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="vendor-stat-card">
                      <span className="vendor-stat-value">{products.length}</span>
                      <span className="vendor-stat-label">Products</span>
                    </div>
                    <div className="vendor-stat-card">
                      <span className="vendor-stat-value">{orders.length}</span>
                      <span className="vendor-stat-label">Orders</span>
                    </div>
                  </>
                )}
              </div>

              <div className="vendor-dashboard-content">
                {activeTab === 'overview' && (
                  <p className="vendor-dashboard-overview-text">Summary of your products and orders.</p>
                )}
                {activeTab === 'products' && (
                  <p className="vendor-dashboard-overview-text">You have {products.length} product(s).</p>
                )}
                {activeTab === 'orders' && (
                  <p className="vendor-dashboard-overview-text">You have {orders.length} order(s) containing your products.</p>
                )}
                <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
