import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { getImageUrl } from '../utils/imageUrl';
import VendorProductForm from '../components/VendorProductForm';
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

const ADMIN_SIDEBAR_NAV = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'products', label: 'All Products', icon: '🛒' },
  { id: 'orders', label: 'Order Management', icon: '📋' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorFilter, setVendorFilter] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [productFormError, setProductFormError] = useState('');
  const [adminProductVendorId, setAdminProductVendorId] = useState('');
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Debounce search: update query 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setProductSearchQuery(productSearchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [productSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setUserSearchQuery(userSearchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [userSearchInput]);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/vendors');
      setVendors(res.data.data || []);
    } catch (err) {
      setVendors([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (vendorFilter) params.set('vendor', vendorFilter);
      if (productSearchQuery) params.set('search', productSearchQuery);
      const res = await axios.get(`/api/products/admin/all?${params.toString()}`);
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
    }
  }, [vendorFilter, productSearchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders/admin/all');
      setOrders(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userRoleFilter) params.set('role', userRoleFilter);
      if (userSearchQuery) params.set('search', userSearchQuery);
      const res = await axios.get(`/api/users?${params.toString()}`);
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    }
  }, [userRoleFilter, userSearchQuery]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchProducts(), fetchOrders(), fetchVendors(), fetchUsers()]);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProducts, fetchOrders, fetchVendors, fetchUsers]);

  const adminStats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'shipped');
    const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const now = new Date();
    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 6);
    last7Start.setHours(0, 0, 0, 0);
    const prev7Start = new Date(last7Start);
    prev7Start.setDate(prev7Start.getDate() - 7);
    const last7Orders = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= last7Start);
    const prev7Orders = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= prev7Start && new Date(o.createdAt) < last7Start);
    const revenueLast7Days = last7Orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const revenuePrev7Days = prev7Orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const revenueTrendPercent = revenuePrev7Days > 0
      ? Math.round(((revenueLast7Days - revenuePrev7Days) / revenuePrev7Days) * 100)
      : (revenueLast7Days > 0 ? 100 : 0);

    const ordersByStatus = {};
    orders.forEach((o) => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1; });
    const ordersByStatusData = Object.entries(ordersByStatus).map(([name, value]) => ({
      name,
      value,
      fill: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444'][Object.keys(ordersByStatus).indexOf(name) % 5] || '#94a3b8'
    }));

    const dayMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), orders: 0, revenue: 0 };
    }
    orders.forEach((o) => {
      const key = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : null;
      if (key && dayMap[key]) {
        dayMap[key].orders += 1;
        dayMap[key].revenue += o.totalAmount || 0;
      }
    });
    const ordersByDay = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    const productRevenueMap = {};
    const productQuantityMap = {};
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((item) => {
        const id = item.product?._id?.toString() || item.product || 'unknown';
        const name = item.product?.name || 'Unknown product';
        const rev = (item.price || 0) * (item.quantity || 0);
        productRevenueMap[id] = (productRevenueMap[id] || { name, revenue: 0, quantity: 0 });
        productRevenueMap[id].name = name;
        productRevenueMap[id].revenue += rev;
        productRevenueMap[id].quantity += item.quantity || 0;
      });
    });
    const topProductsByRevenue = Object.values(productRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const categoryRevenueMap = {};
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((item) => {
        const cat = item.product?.category || 'other';
        const rev = (item.price || 0) * (item.quantity || 0);
        categoryRevenueMap[cat] = (categoryRevenueMap[cat] || 0) + rev;
      });
    });
    const CATEGORY_COLORS = { electronics: '#3b82f6', phones: '#10b981', laptops: '#f59e0b', accessories: '#6366f1', audio: '#ec4899', gaming: '#14b8a6', other: '#94a3b8' };
    const salesByCategoryData = Object.entries(categoryRevenueMap).map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value: Math.round(value * 100) / 100,
      fill: CATEGORY_COLORS[name] || '#94a3b8'
    })).sort((a, b) => b.value - a.value);

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      pendingOrders: pending,
      totalRevenue,
      completedRevenue,
      averageOrderValue,
      revenueLast7Days,
      revenuePrev7Days,
      revenueTrendPercent,
      ordersByStatusData,
      ordersByDay,
      topProductsByRevenue,
      salesByCategoryData
    };
  }, [products.length, orders]);

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);
  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setError('');
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBlockUser = async (userId) => {
    setUpdatingUserId(userId);
    setError('');
    try {
      await axios.patch(`/api/users/${userId}/block`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block user');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUnblockUser = async (userId) => {
    setUpdatingUserId(userId);
    setError('');
    try {
      await axios.patch(`/api/users/${userId}/unblock`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unblock user. Please try again.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!newRole || newRole === '') return;
    setUpdatingRoleUserId(userId);
    setError('');
    try {
      await axios.patch(`/api/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role. Please try again.');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductFormError('');
    setAdminProductVendorId(vendors[0]?._id || '');
    setProductFormOpen(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    const vendorId = product.vendor?._id || product.vendor || '';
    setAdminProductVendorId(vendorId);
    setProductFormError('');
    setProductFormOpen(true);
  };

  const closeProductForm = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
    setProductFormError('');
  };

  const handleProductFormSubmit = async (payload) => {
    if (payload.imageError) {
      setProductFormError(payload.imageError);
      return;
    }
    setProductFormLoading(true);
    setProductFormError('');
    try {
      if (editingProduct?._id) {
        await axios.put(`/api/products/${editingProduct._id}`, { ...payload, vendor: adminProductVendorId });
      } else {
        if (!adminProductVendorId) {
          setProductFormError('Please select a vendor for this product.');
          setProductFormLoading(false);
          return;
        }
        await axios.post('/api/products', { ...payload, vendor: adminProductVendorId });
      }
      closeProductForm();
      fetchProducts();
    } catch (err) {
      setProductFormError(err.response?.data?.message || (editingProduct?._id ? 'Update failed.' : 'Add failed.'));
    } finally {
      setProductFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingProductId(product._id);
    setError('');
    try {
      await axios.delete(`/api/products/${product._id}`);
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <div className="vendor-dashboard-page">
      <Navbar />
      <div className="vendor-dashboard-layout">
        <aside className="vendor-dashboard-sidebar">
          <div className="vendor-sidebar-inner">
            <div className="vendor-sidebar-header">
              <h2 className="vendor-sidebar-title">Admin Dashboard</h2>
              <p className="vendor-sidebar-subtitle">View and manage platform data.</p>
            </div>
            <nav className="vendor-sidebar-nav" aria-label="Admin sections">
              {ADMIN_SIDEBAR_NAV.map(({ id, label, icon }) => (
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
            <p className="vendor-sidebar-footer">Full platform access. View all products and orders.</p>
          </div>
        </aside>

        <main className="vendor-dashboard-main">
          <div className="vendor-dashboard-inner">
            {error && (
              <div className="vendor-dashboard-error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="vendor-dashboard-error-dismiss"
                  onClick={() => setError('')}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {loading ? (
              <div className="vendor-dashboard-loading">Loading…</div>
            ) : activeTab === 'overview' ? (
              <div className="vendor-overview-page">
                <div className="vendor-overview-header">
                  <div>
                    <h1 className="vendor-overview-title">Overview</h1>
                    <p className="vendor-overview-subtitle">Platform-wide snapshot.</p>
                  </div>
                  <Link to="/products" className="vendor-btn vendor-btn-secondary">View Store</Link>
                </div>
                <div className="vendor-kpi-cards">
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{adminStats.totalProducts}</span>
                      <span className="vendor-kpi-badge">Active</span>
                    </div>
                    <span className="vendor-kpi-label">Total products on platform</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{adminStats.totalOrders}</span>
                      <span className="vendor-kpi-badge">All time</span>
                    </div>
                    <span className="vendor-kpi-label">Total orders</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{adminStats.pendingOrders}</span>
                      <span className="vendor-kpi-badge vendor-kpi-badge-warn">Needs action</span>
                    </div>
                    <span className="vendor-kpi-label">Pending / processing</span>
                  </div>
                  <div className="vendor-kpi-card">
                    <div className="vendor-kpi-top">
                      <span className="vendor-kpi-value">{formatPrice(adminStats.totalRevenue)}</span>
                      <span className="vendor-kpi-badge vendor-kpi-badge-success">Revenue</span>
                    </div>
                    <span className="vendor-kpi-label">Total revenue</span>
                  </div>
                </div>
                <div className="vendor-charts-row">
                  <div className="vendor-chart-card">
                    <h3 className="vendor-chart-title">Orders by status</h3>
                    {adminStats.ordersByStatusData?.length === 0 ? (
                      <p className="vendor-chart-empty">No order data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={adminStats.ordersByStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {adminStats.ordersByStatusData.map((entry, index) => (
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
                      <BarChart data={adminStats.ordersByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  <p className="vendor-section-note">All platform orders.</p>
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
                              <td>{formatPrice(order.totalAmount || 0)}</td>
                              <td>
                                <span className={`vendor-order-pill vendor-order-pill-${order.status}`}>{order.status}</span>
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
                <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
              </div>
            ) : activeTab === 'analytics' ? (
              <div className="vendor-analytics-page" data-section="analytics">
                <div className="vendor-analytics-header">
                  <div>
                    <h1 className="vendor-dashboard-title">Platform Analytics</h1>
                    <p className="vendor-dashboard-greeting">Sales and performance over the last 30 days.</p>
                  </div>
                  <Link to="/products" className="vendor-btn vendor-btn-secondary">View Store</Link>
                </div>

                <section className="vendor-analytics-section" aria-labelledby="analytics-sales-overview">
                  <h2 id="analytics-sales-overview" className="vendor-analytics-section-title">Sales overview</h2>
                  <div className="vendor-kpi-cards vendor-kpi-cards-wrap">
                    <div className="vendor-kpi-card">
                      <div className="vendor-kpi-top">
                        <span className="vendor-kpi-value">{formatPrice(adminStats.totalRevenue)}</span>
                        <span className="vendor-kpi-badge vendor-kpi-badge-success">All time</span>
                      </div>
                      <span className="vendor-kpi-label">Total revenue</span>
                    </div>
                    <div className="vendor-kpi-card">
                      <div className="vendor-kpi-top">
                        <span className="vendor-kpi-value">{formatPrice(adminStats.completedRevenue)}</span>
                        <span className="vendor-kpi-badge">Delivered / shipped</span>
                      </div>
                      <span className="vendor-kpi-label">Completed sales</span>
                    </div>
                    <div className="vendor-kpi-card">
                      <div className="vendor-kpi-top">
                        <span className="vendor-kpi-value">{formatPrice(adminStats.averageOrderValue)}</span>
                        <span className="vendor-kpi-badge">AOV</span>
                      </div>
                      <span className="vendor-kpi-label">Average order value</span>
                    </div>
                    <div className="vendor-kpi-card">
                      <div className="vendor-kpi-top">
                        <span className="vendor-kpi-value">{adminStats.totalOrders}</span>
                        <span className="vendor-kpi-badge">Orders</span>
                      </div>
                      <span className="vendor-kpi-label">Total orders</span>
                    </div>
                    <div className="vendor-kpi-card">
                      <div className="vendor-kpi-top">
                        <span className="vendor-kpi-value">{adminStats.revenueTrendPercent >= 0 ? `+${adminStats.revenueTrendPercent}%` : `${adminStats.revenueTrendPercent}%`}</span>
                        <span className={`vendor-kpi-badge ${adminStats.revenueTrendPercent >= 0 ? 'vendor-kpi-badge-success' : 'vendor-kpi-badge-warn'}`}>
                          vs last 7 days
                        </span>
                      </div>
                      <span className="vendor-kpi-label">Revenue trend</span>
                    </div>
                    <div className="vendor-kpi-card">
                      <div className="vendor-kpi-top">
                        <span className="vendor-kpi-value">{adminStats.pendingOrders}</span>
                        <span className="vendor-kpi-badge vendor-kpi-badge-warn">Action</span>
                      </div>
                      <span className="vendor-kpi-label">Pending orders</span>
                    </div>
                  </div>
                </section>

                <section className="vendor-analytics-section" aria-labelledby="analytics-charts">
                  <h2 id="analytics-charts" className="vendor-analytics-section-title">Charts</h2>
                  <div className="vendor-charts-row">
                    <div className="vendor-chart-card">
                      <h3 className="vendor-chart-title">Revenue over time (last 30 days)</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={adminStats.ordersByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            formatter={(value) => [formatPrice(value), 'Revenue']}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                          />
                          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="vendor-chart-card">
                      <h3 className="vendor-chart-title">Orders by status</h3>
                      {adminStats.ordersByStatusData?.length === 0 ? (
                        <p className="vendor-chart-empty">No order data yet</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={adminStats.ordersByStatusData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {adminStats.ordersByStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="vendor-charts-row">
                    <div className="vendor-chart-card">
                      <h3 className="vendor-chart-title">Orders & revenue (last 30 days)</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={adminStats.ordersByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                    <div className="vendor-chart-card">
                      <h3 className="vendor-chart-title">Sales by category</h3>
                      {adminStats.salesByCategoryData?.length === 0 ? (
                        <p className="vendor-chart-empty">No sales data yet</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={adminStats.salesByCategoryData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value }) => `${name}: ${formatPrice(value)}`}
                            >
                              {adminStats.salesByCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatPrice(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </section>

                <section className="vendor-analytics-section vendor-analytics-top-products" aria-labelledby="analytics-top-products">
                  <h2 id="analytics-top-products" className="vendor-analytics-section-title">Top products by revenue</h2>
                  {adminStats.topProductsByRevenue?.length === 0 ? (
                    <p className="vendor-chart-empty">No sales data yet</p>
                  ) : (
                    <div className="vendor-orders-table-wrap">
                      <table className="vendor-orders-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Units sold</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats.topProductsByRevenue.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.name}</td>
                              <td>{row.quantity}</td>
                              <td>{formatPrice(row.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
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
                    {activeTab === 'products' ? 'All Products' : activeTab === 'orders' ? 'Order Management' : 'User Management'}
                  </h1>
                  <p className="vendor-dashboard-greeting">Hello, {displayName}</p>
                </div>
                <div className="vendor-stats vendor-stats-two">
                  <div className="vendor-stat-card">
                    <span className="vendor-stat-value">{activeTab === 'users' ? users.length : products.length}</span>
                    <span className="vendor-stat-label">{activeTab === 'users' ? 'Users' : 'Products'}</span>
                  </div>
                  <div className="vendor-stat-card">
                    <span className="vendor-stat-value">{activeTab === 'users' ? users.filter((u) => u.isBlocked).length : orders.length}</span>
                    <span className="vendor-stat-label">{activeTab === 'users' ? 'Blocked' : 'Orders'}</span>
                  </div>
                </div>
                <div className="vendor-dashboard-content">
                  {activeTab === 'products' && (
                    <div className="vendor-products-section">
                      <div className="vendor-products-header">
                        <h2 className="vendor-products-heading">All products on the platform</h2>
                        <button type="button" className="vendor-btn vendor-btn-primary" onClick={openAddProduct}>
                          Add Product
                        </button>
                      </div>
                      <div className="vendor-products-filters">
                        <label htmlFor="admin-vendor-filter" className="vendor-filter-label">Filter by vendor:</label>
                        <select
                          id="admin-vendor-filter"
                          className="vendor-filter-select"
                          value={vendorFilter}
                          onChange={(e) => setVendorFilter(e.target.value)}
                        >
                          <option value="">All vendors</option>
                          {vendors.map((v) => (
                            <option key={v._id} value={v._id}>
                              {v.name || v.email || v._id}
                            </option>
                          ))}
                        </select>
                        <label htmlFor="admin-product-search" className="vendor-filter-label">Search:</label>
                        <input
                          id="admin-product-search"
                          type="search"
                          className="vendor-search-input"
                          placeholder="Search by name or description..."
                          value={productSearchInput}
                          onChange={(e) => setProductSearchInput(e.target.value)}
                          aria-label="Search products by name or description"
                        />
                        {productSearchInput && (
                          <button
                            type="button"
                            className="vendor-search-clear"
                            onClick={() => setProductSearchInput('')}
                            aria-label="Clear search"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {products.length === 0 ? (
                        <p className="vendor-dashboard-overview-text">No products on the platform yet.</p>
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
                                  {p.vendor && (
                                    <> · <span className="vendor-product-card-vendor">Vendor: {typeof p.vendor === 'object' ? (p.vendor.name || p.vendor.email) : '—'}</span></>
                                  )}
                                </p>
                                <div className="vendor-product-card-actions">
                                  <button
                                    type="button"
                                    className="vendor-btn vendor-btn-secondary"
                                    onClick={() => openEditProduct(p)}
                                    disabled={productFormOpen}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="vendor-btn vendor-btn-danger"
                                    onClick={() => handleDeleteProduct(p)}
                                    disabled={deletingProductId !== null}
                                  >
                                    {deletingProductId === p._id ? 'Deleting…' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {productFormOpen && (
                        <div
                          className="vendor-modal-backdrop"
                          onClick={closeProductForm}
                          role="presentation"
                        >
                          <div
                            className="vendor-modal"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-product-form-title"
                          >
                            <div className="vendor-modal-header">
                              <h2 id="admin-product-form-title" className="vendor-modal-title">
                                {editingProduct ? 'Edit product' : 'Add product'}
                              </h2>
                              <button
                                type="button"
                                className="vendor-modal-close"
                                onClick={closeProductForm}
                                aria-label="Close"
                              >
                                ×
                              </button>
                            </div>
                            <p className="vendor-modal-desc">
                              {editingProduct ? 'Update the details below. You can change the assigned vendor.' : 'Select a vendor and fill in the details to add a new product.'}
                            </p>
                            <div className="vendor-product-form-group admin-product-vendor-field" style={{ padding: '0 24px 16px' }}>
                              <label htmlFor="admin-product-vendor">Vendor *</label>
                              <select
                                id="admin-product-vendor"
                                className="vendor-filter-select"
                                value={adminProductVendorId}
                                onChange={(e) => setAdminProductVendorId(e.target.value)}
                                required
                              >
                                <option value="">Select a vendor</option>
                                {vendors.map((v) => (
                                  <option key={v._id} value={v._id}>
                                    {v.name || v.email || v._id}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <VendorProductForm
                              key={editingProduct?._id ?? 'new'}
                              product={editingProduct}
                              onSubmit={handleProductFormSubmit}
                              onCancel={closeProductForm}
                              loading={productFormLoading}
                              error={productFormError}
                            />
                          </div>
                        </div>
                      )}
                      <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                    </div>
                  )}
                  {activeTab === 'users' && (
                    <div className="vendor-orders-section">
                      <h2 className="vendor-orders-heading">All users</h2>
                      <div className="vendor-products-filters">
                        <label htmlFor="admin-user-role" className="vendor-filter-label">Role:</label>
                        <select
                          id="admin-user-role"
                          className="vendor-filter-select"
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                        >
                          <option value="">All roles</option>
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <label htmlFor="admin-user-search" className="vendor-filter-label">Search:</label>
                        <input
                          id="admin-user-search"
                          type="search"
                          className="vendor-search-input"
                          placeholder="Name or email..."
                          value={userSearchInput}
                          onChange={(e) => setUserSearchInput(e.target.value)}
                          aria-label="Search users by name or email"
                        />
                        {userSearchInput && (
                          <button
                            type="button"
                            className="vendor-search-clear"
                            onClick={() => setUserSearchInput('')}
                            aria-label="Clear search"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {users.length === 0 ? (
                        <p className="vendor-dashboard-overview-text">No users match your filters.</p>
                      ) : (
                        <div className="vendor-orders-table-wrap">
                          <table className="vendor-orders-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u) => (
                                <tr key={u._id}>
                                  <td>{u.name || '—'}</td>
                                  <td>{u.email || '—'}</td>
                                  <td>
                                    {u._id === user?.id ? (
                                      <span className="vendor-order-pill vendor-order-pill-delivered">{u.role}</span>
                                    ) : updatingRoleUserId === u._id ? (
                                      <span className="vendor-order-updating">Updating…</span>
                                    ) : (
                                      <select
                                        className="vendor-order-status-select vendor-user-role-select"
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                        disabled={updatingRoleUserId !== null}
                                        aria-label={`Change role for ${u.name || u.email}`}
                                      >
                                        <option value="customer">customer</option>
                                        <option value="vendor">vendor</option>
                                        <option value="admin">admin</option>
                                      </select>
                                    )}
                                  </td>
                                  <td>
                                    <span className={u.isBlocked ? 'vendor-order-pill vendor-order-pill-cancelled' : 'vendor-order-pill vendor-order-pill-delivered'}>
                                      {u.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                  </td>
                                  <td>
                                    {u._id === user?.id ? (
                                      <span className="vendor-order-updating">(You)</span>
                                    ) : updatingUserId === u._id ? (
                                      <span className="vendor-order-updating">Updating…</span>
                                    ) : u.isBlocked ? (
                                      <button
                                        type="button"
                                        className="vendor-btn vendor-btn-secondary"
                                        onClick={() => handleUnblockUser(u._id)}
                                        disabled={updatingUserId !== null}
                                      >
                                        Unblock
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="vendor-btn vendor-btn-danger"
                                        onClick={() => handleBlockUser(u._id)}
                                        disabled={updatingUserId !== null}
                                      >
                                        Block
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                    </div>
                  )}
                  {activeTab === 'orders' && (
                    <div className="vendor-orders-section">
                      <h2 className="vendor-orders-heading">All orders on the platform</h2>
                      {orders.length === 0 ? (
                        <p className="vendor-dashboard-overview-text">No orders yet.</p>
                      ) : (
                        <div className="vendor-orders-list">
                          {orders.map((order) => (
                            <div key={order._id} className="vendor-order-card">
                              <div className="vendor-order-card-header">
                                <span className="vendor-order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                                <span className={`vendor-order-status vendor-order-status-${order.status}`}>{order.status}</span>
                              </div>
                              <p className="vendor-order-date">
                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                              </p>
                              <p className="vendor-order-customer">
                                Customer: {order.user?.name || order.user?.email || '—'}
                              </p>
                              <ul className="vendor-order-items">
                                {order.items?.map((item, idx) => (
                                  <li key={idx} className="vendor-order-item">
                                    {item.product?.name} × {item.quantity} @ {formatPrice(item.price)} = {formatPrice((item.price || 0) * (item.quantity || 0))}
                                  </li>
                                ))}
                              </ul>
                              <div className="vendor-order-footer">
                                <span className="vendor-order-subtotal">Total: {formatPrice(order.totalAmount || 0)}</span>
                                <div className="vendor-order-actions">
                                  <label htmlFor={`status-${order._id}`} className="vendor-order-status-label">Status:</label>
                                  <select
                                    id={`status-${order._id}`}
                                    className="vendor-order-status-select"
                                    value={order.status}
                                    onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                    disabled={updatingOrderId === order._id}
                                  >
                                    {ORDER_STATUSES.map((s) => (
                                      <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                  </select>
                                  {updatingOrderId === order._id && <span className="vendor-order-updating">Updating…</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
    </div>
  );
};

export default AdminDashboard;
