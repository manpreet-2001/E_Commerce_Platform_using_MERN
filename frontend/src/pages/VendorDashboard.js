import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { computeVendorStats } from '../utils/vendorStats';
import VendorProductForm from '../components/VendorProductForm';
import { getImageUrl } from '../utils/imageUrl';
import './VendorDashboard.css';

const CATEGORY_LABELS = {
  electronics: 'Electronics',
  phones: 'Phones',
  laptops: 'Laptops',
  accessories: 'Accessories',
  audio: 'Audio',
  gaming: 'Gaming',
  other: 'Other',
};

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const VENDOR_SIDEBAR_NAV = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'products', label: 'Product Management', icon: '🛒' },
  { id: 'orders', label: 'Order Management', icon: '📋' },
  { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐' },
  { id: 'profile', label: 'Vendor Profile', icon: '👤' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

const VendorDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileFormName, setProfileFormName] = useState('');
  const [profileFormEmail, setProfileFormEmail] = useState('');
  const [profileFormError, setProfileFormError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [vendorOrderStatusFilter, setVendorOrderStatusFilter] = useState('');
  const [vendorOrderSearchInput, setVendorOrderSearchInput] = useState('');
  const [vendorOrderSearchQuery, setVendorOrderSearchQuery] = useState('');
  const [vendorProductCategoryFilter, setVendorProductCategoryFilter] = useState('');
  const [vendorProductSearchInput, setVendorProductSearchInput] = useState('');
  const [vendorProductSearchQuery, setVendorProductSearchQuery] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setVendorOrderSearchQuery(vendorOrderSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [vendorOrderSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => setVendorProductSearchQuery(vendorProductSearchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [vendorProductSearchInput]);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (vendorProductCategoryFilter) params.set('category', vendorProductCategoryFilter);
      if (vendorProductSearchQuery) params.set('search', vendorProductSearchQuery);
      const res = await axios.get(`/api/products/vendor/mine?${params.toString()}`);
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
    }
  }, [vendorProductCategoryFilter, vendorProductSearchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (vendorOrderStatusFilter) params.set('status', vendorOrderStatusFilter);
      if (vendorOrderSearchQuery) params.set('search', vendorOrderSearchQuery);
      const res = await axios.get(`/api/orders/vendor/mine?${params.toString()}`);
      setOrders(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    }
  }, [vendorOrderStatusFilter, vendorOrderSearchQuery]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get('/api/reviews/vendor/mine');
      setReviews(res.data.data || []);
    } catch (err) {
      setReviews([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchProducts(), fetchOrders(), fetchReviews()]);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProducts, fetchOrders, fetchReviews]);

  const vendorStats = useMemo(
    () => computeVendorStats(products, orders),
    [products, orders]
  );

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders
      .filter((o) => o.createdAt && new Date(o.createdAt).toISOString().slice(0, 10) === today)
      .reduce((sum, o) => sum + (o.vendorSubtotal || 0), 0);
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Vendor';

  const openAddForm = () => {
    setEditingProduct(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
    setFormError('');
  };

  const handleFormSubmit = async (payload) => {
    if (payload.imageError) {
      setFormError(payload.imageError);
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editingProduct?._id) {
        await axios.put(`/api/products/${editingProduct._id}`, payload);
      } else {
        await axios.post('/api/products', payload);
      }
      closeForm();
      setFormLoading(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || (editingProduct?._id ? 'Update failed' : 'Add failed'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await axios.delete(`/api/products/${product._id}`);
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const startProfileEdit = () => {
    setProfileFormName(user?.name || '');
    setProfileFormEmail(user?.email || '');
    setProfileFormError('');
    setProfileEditing(true);
  };

  const cancelProfileEdit = () => {
    setProfileEditing(false);
    setProfileFormError('');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const name = (profileFormName || '').trim();
    const email = (profileFormEmail || '').trim().toLowerCase();
    if (!name || name.length < 2) {
      setProfileFormError('Name must be at least 2 characters.');
      return;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setProfileFormError('Please enter a valid email address.');
      return;
    }
    setProfileSaving(true);
    setProfileFormError('');
    try {
      await axios.put('/api/auth/profile', { name, email });
      if (refreshUser) await refreshUser();
      setProfileEditing(false);
    } catch (err) {
      setProfileFormError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setError('');
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="vendor-dashboard-page">
      <Navbar />
      <div className="vendor-dashboard-layout">
        <aside className="vendor-dashboard-sidebar">
          <div className="vendor-sidebar-inner">
            <div className="vendor-sidebar-header">
              <h2 className="vendor-sidebar-title">Vendor Dashboard</h2>
              <p className="vendor-sidebar-subtitle">Manage your products and orders.</p>
            </div>
            <nav className="vendor-sidebar-nav" aria-label="Dashboard sections">
              {VENDOR_SIDEBAR_NAV.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`vendor-sidebar-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <span className="vendor-sidebar-icon" aria-hidden>{icon}</span>
                  {label}
                </button>
              ))}
            </nav>
            <p className="vendor-sidebar-footer">
              Vendors can only manage their own products and orders.
            </p>
          </div>
        </aside>

        <main className="vendor-dashboard-main">
          <div className="vendor-dashboard-inner">
            {error && <div className="vendor-dashboard-error">{error}</div>}

            {loading ? (
              <div className="vendor-dashboard-loading">Loading…</div>
            ) : activeTab === 'overview' ? (
              <div className="vendor-overview-page">
                <div className="vendor-overview-header">
                  <div>
                    <h1 className="vendor-overview-title">Overview</h1>
                    <p className="vendor-overview-subtitle">Quick snapshot of your store performance.</p>
                  </div>
                  <div className="vendor-overview-actions">
                    <Link to="/products" className="vendor-btn vendor-btn-secondary">View Store</Link>
                    <button type="button" className="vendor-btn vendor-btn-primary" onClick={openAddForm}>
                      Add Product
                    </button>
                  </div>
                </div>

                <div className="vendor-kpi-cards">
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{vendorStats.totalProducts}</span>
                      <span className="vendor-kpi-badge">Active</span>
                    </div>
                    <span className="vendor-kpi-label">Total products listed</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{vendorStats.totalOrders}</span>
                      <span className="vendor-kpi-badge">All time</span>
                    </div>
                    <span className="vendor-kpi-label">Total orders received</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{vendorStats.pendingOrders}</span>
                      <span className="vendor-kpi-badge vendor-kpi-badge-warn">Needs action</span>
                    </div>
                    <span className="vendor-kpi-label">Pending / processing</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{formatPrice(todaySales)}</span>
                      <span className="vendor-kpi-badge vendor-kpi-badge-success">+0%</span>
                    </div>
                    <span className="vendor-kpi-label">Today&apos;s sales</span>
                  </div>
                </div>

                <div className="vendor-charts-row">
                  <div className="vendor-chart-card">
                    <h3 className="vendor-chart-title">Orders by status</h3>
                    {vendorStats.ordersByStatusData.length === 0 ? (
                      <p className="vendor-chart-empty">No order data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={vendorStats.ordersByStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {vendorStats.ordersByStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="vendor-chart-card">
                    <h3 className="vendor-chart-title">Orders & revenue (last 30 days)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={vendorStats.ordersByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          formatter={(value, name) => (name === 'revenue' ? formatPrice(value) : value)}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                        />
                        <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <section className="vendor-recent-orders">
                  <h2 className="vendor-section-title">Recent Orders</h2>
                  <p className="vendor-section-note">Orders shown here include only products sold by your shop.</p>
                  {recentOrders.length === 0 ? (
                    <p className="vendor-empty-text">No orders yet.</p>
                  ) : (
                    <div className="vendor-orders-table-wrap">
                      <table className="vendor-orders-table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order._id}>
                              <td>#{order._id.slice(-6).toUpperCase()}</td>
                              <td>{order.user?.name || order.user?.email || '—'}</td>
                              <td>{formatPrice(order.vendorSubtotal || 0)}</td>
                              <td>
                                <span className={`vendor-order-pill vendor-order-pill-${order.status}`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="vendor-notifications">
                  <h2 className="vendor-section-title">Notifications</h2>
                  <p className="vendor-section-note">New order and status alerts (optional).</p>
                  {recentOrders.length === 0 ? (
                    <p className="vendor-empty-text">No notifications.</p>
                  ) : (
                    <ul className="vendor-notification-list">
                      {recentOrders.slice(0, 3).map((order) => (
                        <li key={order._id} className="vendor-notification-item">
                          <span className="vendor-notification-text">
                            {order.status === 'pending' ? `New order #${order._id.slice(-6).toUpperCase()}` : `Order #${order._id.slice(-6).toUpperCase()} updated`}
                            {' '}({order.items?.length || 0} items)
                          </span>
                          <span className={`vendor-order-pill vendor-order-pill-${order.status}`}>{order.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : activeTab === 'analytics' ? (
              <div className="vendor-analytics-page" data-section="analytics">
                <div className="vendor-content-header">
                  <h1 className="vendor-dashboard-title">Analytics</h1>
                  <p className="vendor-dashboard-greeting">Charts and statistics for your products and orders.</p>
                </div>
                <div className="vendor-kpi-cards">
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{vendorStats.totalProducts}</span>
                      <span className="vendor-kpi-badge">Active</span>
                    </div>
                    <span className="vendor-kpi-label">Total products listed</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{vendorStats.totalOrders}</span>
                      <span className="vendor-kpi-badge">All time</span>
                    </div>
                    <span className="vendor-kpi-label">Total orders received</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{formatPrice(vendorStats.totalRevenue)}</span>
                      <span className="vendor-kpi-badge">Revenue</span>
                    </div>
                    <span className="vendor-kpi-label">Total revenue</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{vendorStats.pendingOrders}</span>
                      <span className="vendor-kpi-badge vendor-kpi-badge-warn">Needs action</span>
                    </div>
                    <span className="vendor-kpi-label">Pending orders</span>
                  </div>
                </div>
                <div className="vendor-charts-row">
                  <div className="vendor-chart-card">
                    <h3 className="vendor-chart-title">Orders by status</h3>
                    {vendorStats.ordersByStatusData.length === 0 ? (
                      <p className="vendor-chart-empty">No order data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={vendorStats.ordersByStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {vendorStats.ordersByStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="vendor-chart-card">
                    <h3 className="vendor-chart-title">Orders & revenue (last 30 days)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={vendorStats.ordersByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          formatter={(value, name) => (name === 'revenue' ? formatPrice(value) : value)}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                        />
                        <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
              </div>
            ) : activeTab === 'reviews' ? (
              <div className="vendor-reviews-page">
                <div className="vendor-content-header">
                  <h1 className="vendor-dashboard-title">Reviews &amp; Ratings</h1>
                  <p className="vendor-dashboard-greeting">Reviews left by customers on your products. View only.</p>
                </div>
                {reviews.length === 0 ? (
                  <p className="vendor-empty-text">No reviews yet on your products.</p>
                ) : (
                  <div className="vendor-orders-table-wrap">
                    <table className="vendor-orders-table vendor-reviews-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Customer</th>
                          <th>Rating</th>
                          <th>Comment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((r) => (
                          <tr key={r._id}>
                            <td>{r.product?.name || '—'}</td>
                            <td>
                              <span className="vendor-review-customer-name">{r.user?.name || '—'}</span>
                              {r.user?.email && <span className="vendor-review-customer-email">{r.user.email}</span>}
                            </td>
                            <td>{r.rating}/5</td>
                            <td className="vendor-review-comment-cell">{r.comment || '—'}</td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'profile' ? (
              <div className="vendor-profile-page">
                <div className="vendor-content-header">
                  <h1 className="vendor-dashboard-title">Vendor Profile</h1>
                  <p className="vendor-dashboard-greeting">Your account details.</p>
                </div>
                <section className="vendor-profile-card">
                  <div className="vendor-profile-avatar" aria-hidden="true">
                    {(profileEditing ? profileFormName : user?.name)?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  {profileEditing ? (
                    <form onSubmit={handleProfileSave} className="vendor-profile-edit-form">
                      {profileFormError && (
                        <div className="vendor-dashboard-error" role="alert" style={{ marginBottom: 12 }}>
                          {profileFormError}
                        </div>
                      )}
                      <div className="vendor-product-form-group" style={{ marginBottom: 12 }}>
                        <label htmlFor="vendor-profile-name">Name</label>
                        <input
                          id="vendor-profile-name"
                          type="text"
                          className="vendor-search-input"
                          value={profileFormName}
                          onChange={(e) => setProfileFormName(e.target.value)}
                          required
                          minLength={2}
                          placeholder="Your name"
                        />
                      </div>
                      <div className="vendor-product-form-group" style={{ marginBottom: 16 }}>
                        <label htmlFor="vendor-profile-email">Email</label>
                        <input
                          id="vendor-profile-email"
                          type="email"
                          className="vendor-search-input"
                          value={profileFormEmail}
                          onChange={(e) => setProfileFormEmail(e.target.value)}
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                      <p className="vendor-profile-field" style={{ marginBottom: 16 }}>
                        <span className="vendor-profile-field-label">Account type</span>
                        <span className="vendor-profile-field-value">Vendor</span>
                      </p>
                      <div className="vendor-profile-actions">
                        <button type="button" className="vendor-btn vendor-btn-secondary" onClick={cancelProfileEdit} disabled={profileSaving}>
                          Cancel
                        </button>
                        <button type="submit" className="vendor-btn vendor-btn-primary" disabled={profileSaving}>
                          {profileSaving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="vendor-profile-info">
                        <p className="vendor-profile-field">
                          <span className="vendor-profile-field-label">Name</span>
                          <span className="vendor-profile-field-value">{user?.name || '—'}</span>
                        </p>
                        <p className="vendor-profile-field">
                          <span className="vendor-profile-field-label">Email</span>
                          <span className="vendor-profile-field-value">{user?.email || '—'}</span>
                        </p>
                        <p className="vendor-profile-field">
                          <span className="vendor-profile-field-label">Account type</span>
                          <span className="vendor-profile-field-value">Vendor</span>
                        </p>
                      </div>
                      <div className="vendor-profile-actions">
                        <button type="button" className="vendor-btn vendor-btn-primary" onClick={startProfileEdit}>
                          Edit profile
                        </button>
                        <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                      </div>
                    </>
                  )}
                </section>
              </div>
            ) : activeTab === 'notifications' ? (
              <div className="vendor-placeholder-page">
                <h1 className="vendor-dashboard-title">Notifications</h1>
                <p className="vendor-dashboard-overview-text">Coming soon.</p>
                <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
              </div>
            ) : (
            <>
              <div className="vendor-content-header">
                <h1 className="vendor-dashboard-title">
                  {activeTab === 'products' ? 'Product Management' : 'Order Management'}
                </h1>
                <p className="vendor-dashboard-greeting">Hello, {displayName}</p>
              </div>

              <div className="vendor-stats vendor-stats-two">
                <div className="vendor-stat-card">
                  <span className="vendor-stat-value">{products.length}</span>
                  <span className="vendor-stat-label">Products</span>
                </div>
                <div className="vendor-stat-card">
                  <span className="vendor-stat-value">{orders.length}</span>
                  <span className="vendor-stat-label">Orders</span>
                </div>
              </div>

              <div className="vendor-dashboard-content">
                {activeTab === 'products' && (
                  <div className="vendor-products-section">
                    <div className="vendor-products-header">
                      <h2 className="vendor-products-heading">Your products</h2>
                      <button type="button" className="vendor-products-add-btn" onClick={openAddForm}>
                        + Add Product
                      </button>
                    </div>
                    <div className="vendor-products-filters">
                      <label htmlFor="vendor-product-category" className="vendor-filter-label">Category:</label>
                      <select
                        id="vendor-product-category"
                        className="vendor-filter-select"
                        value={vendorProductCategoryFilter}
                        onChange={(e) => setVendorProductCategoryFilter(e.target.value)}
                      >
                        <option value="">All categories</option>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <label htmlFor="vendor-product-search" className="vendor-filter-label">Search:</label>
                      <input
                        id="vendor-product-search"
                        type="search"
                        className="vendor-search-input"
                        placeholder="Name or description..."
                        value={vendorProductSearchInput}
                        onChange={(e) => setVendorProductSearchInput(e.target.value)}
                        aria-label="Search products by name or description"
                      />
                      {(vendorProductSearchInput || vendorProductCategoryFilter) && (
                        <button type="button" className="vendor-search-clear" onClick={() => { setVendorProductSearchInput(''); setVendorProductCategoryFilter(''); }}>Clear</button>
                      )}
                    </div>
                    {products.length === 0 ? (
                      <p className="vendor-dashboard-overview-text">No products match your filters. Click &quot;Add Product&quot; to create one.</p>
                    ) : (
                      <div className="vendor-products-list">
                        {products.map((p) => (
                          <div key={p._id} className="vendor-product-card">
                            <div className="vendor-product-card-image">
                              {p.image ? (
                                <img src={getImageUrl(p.image)} alt="" />
                              ) : (
                                <span className="vendor-product-card-no-image">No image</span>
                              )}
                            </div>
                            <div className="vendor-product-card-body">
                              <h3 className="vendor-product-card-name">{p.name}</h3>
                              <p className="vendor-product-card-meta">
                                {formatPrice(p.price)} · {CATEGORY_LABELS[p.category] || p.category} · Stock: {p.stock}
                              </p>
                              <div className="vendor-product-card-actions">
                                <button type="button" className="vendor-product-card-btn vendor-product-card-btn-edit" onClick={() => openEditForm(p)}>
                                  Edit
                                </button>
                                <button type="button" className="vendor-product-card-btn vendor-product-card-btn-delete" onClick={() => handleDeleteProduct(p)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                  </div>
                )}
                {activeTab === 'orders' && (
                  <div className="vendor-orders-section">
                    <h2 className="vendor-orders-heading">Orders containing your products</h2>
                    <div className="vendor-products-filters">
                      <label htmlFor="vendor-order-status-filter" className="vendor-filter-label">Status:</label>
                      <select
                        id="vendor-order-status-filter"
                        className="vendor-filter-select"
                        value={vendorOrderStatusFilter}
                        onChange={(e) => setVendorOrderStatusFilter(e.target.value)}
                      >
                        <option value="">All statuses</option>
                        {ORDER_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <label htmlFor="vendor-order-search" className="vendor-filter-label">Search customer:</label>
                      <input
                        id="vendor-order-search"
                        type="search"
                        className="vendor-search-input"
                        placeholder="Name or email..."
                        value={vendorOrderSearchInput}
                        onChange={(e) => setVendorOrderSearchInput(e.target.value)}
                        aria-label="Search orders by customer name or email"
                      />
                      {(vendorOrderSearchInput || vendorOrderStatusFilter) && (
                        <button type="button" className="vendor-search-clear" onClick={() => { setVendorOrderSearchInput(''); setVendorOrderStatusFilter(''); }}>Clear</button>
                      )}
                    </div>
                    {orders.length === 0 ? (
                      <p className="vendor-dashboard-overview-text">No orders match your filters.</p>
                    ) : (
                      (() => {
                        const byStatus = { pending: [], confirmed: [], shipped: [], delivered: [], cancelled: [] };
                        orders.forEach((o) => {
                          if (byStatus[o.status]) byStatus[o.status].push(o);
                        });
                        const statusSections = [
                          { key: 'pending', label: 'Pending', orders: byStatus.pending },
                          { key: 'confirmed', label: 'Confirmed', orders: byStatus.confirmed },
                          { key: 'shipped', label: 'Shipped', orders: byStatus.shipped },
                          { key: 'delivered', label: 'Delivered', orders: byStatus.delivered },
                          { key: 'cancelled', label: 'Cancelled', orders: byStatus.cancelled },
                        ].filter((s) => s.orders.length > 0 && (!vendorOrderStatusFilter || s.key === vendorOrderStatusFilter));

                        return statusSections.map((section) => (
                          <div key={section.key} className="vendor-order-status-block">
                            <h3 className="vendor-order-status-heading">{section.label}</h3>
                            <div className="vendor-orders-table-wrap">
                              <table className="vendor-orders-table vendor-order-management-table">
                                <thead>
                                  <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Products</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.orders.map((order) => (
                                    <tr key={order._id}>
                                      <td>#{order._id.slice(-6).toUpperCase()}</td>
                                      <td>
                                        <span className="vendor-order-table-customer-name">{order.user?.name || '—'}</span>
                                        <br />
                                        <span className="vendor-order-table-customer-email">{order.user?.email || '—'}</span>
                                      </td>
                                      <td>
                                        <ul className="vendor-order-table-products">
                                          {(order.items || []).map((item, idx) => (
                                            <li key={idx}>{item.product?.name} (×{item.quantity})</li>
                                          ))}
                                        </ul>
                                      </td>
                                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + new Date(order.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' }) : '—'}</td>
                                      <td className="vendor-order-table-total">{formatPrice(order.vendorSubtotal || 0)}</td>
                                      <td>
                                        <span className={`vendor-order-pill vendor-order-pill-${order.status}`}>{order.status}</span>
                                      </td>
                                      <td>
                                        <select
                                          className="vendor-order-status-select"
                                          value={order.status}
                                          onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                          disabled={updatingOrderId === order._id}
                                          aria-label={`Change status for order ${order._id.slice(-6)}`}
                                        >
                                          {ORDER_STATUSES.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                          ))}
                                        </select>
                                        {updatingOrderId === order._id && <span className="vendor-order-updating">…</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ));
                      })()
                    )}
                    <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        </main>
      </div>

      {formOpen && (
        <div
          className="vendor-modal-backdrop"
          onClick={closeForm}
          role="presentation"
        >
          <div
            className="vendor-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-product-form-title"
            aria-describedby="vendor-product-form-desc"
          >
            <div className="vendor-modal-header">
              <h2 id="vendor-product-form-title" className="vendor-modal-title">
                {editingProduct ? 'Edit product' : 'Add product'}
              </h2>
              <button
                type="button"
                className="vendor-modal-close"
                onClick={closeForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p id="vendor-product-form-desc" className="vendor-modal-desc">
              {editingProduct
                ? 'Update the details below and save changes.'
                : 'Fill in the details to add a new product.'}
            </p>
            <VendorProductForm
              key={editingProduct?._id ?? 'new'}
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
              loading={formLoading}
              error={formError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
