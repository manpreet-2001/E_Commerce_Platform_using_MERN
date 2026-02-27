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
import { buildCsv, downloadCsv } from '../utils/csvExport';
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

const exportOrdersToCsv = (ordersList, formatPriceFn) => {
  const header = [
    'Order ID',
    'Date',
    'Customer Name',
    'Customer Email',
    'Status',
    'Total',
    'Payment',
    'Shipping Name',
    'Address',
    'City',
    'State',
    'ZIP',
    'Country',
    'Items',
    'Vendors'
  ];
  const addr = (o) => o.shippingAddress || {};
  const rows = (ordersList || []).map((order) => {
    const vendorNames = [...new Set((order.items || [])
      .map((i) => i.product?.vendor?.name || i.product?.vendor?.email || '')
      .filter(Boolean))];
    const itemsSummary = (order.items || [])
      .map((i) => `${i.product?.name || 'Product'} × ${i.quantity || 0}`)
      .join('; ');
    return [
      order._id ? `#${order._id.slice(-6).toUpperCase()}` : '',
      order.createdAt ? new Date(order.createdAt).toISOString() : '',
      order.user?.name || '',
      order.user?.email || '',
      order.status || '',
      formatPriceFn(order.totalAmount || 0),
      order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || '',
      addr(order).fullName || '',
      addr(order).address || '',
      addr(order).city || '',
      addr(order).state || '',
      addr(order).zip || '',
      addr(order).country || '',
      itemsSummary,
      vendorNames.join(', ')
    ];
  });
  const csv = buildCsv([header, ...rows]);
  const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
};

const ADMIN_SIDEBAR_NAV = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'products', label: 'All Products', icon: '🛒' },
  { id: 'orders', label: 'Order Management', icon: '📋' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐' },
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
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
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
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormNewPassword, setUserFormNewPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState('customer');
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderVendorFilter, setOrderVendorFilter] = useState('');
  const [orderSort, setOrderSort] = useState('dateDesc');
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewEditId, setReviewEditId] = useState(null);
  const [reviewEditRating, setReviewEditRating] = useState(5);
  const [reviewEditComment, setReviewEditComment] = useState('');
  const [reviewEditSaving, setReviewEditSaving] = useState(false);
  const [reviewEditError, setReviewEditError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [notificationSort, setNotificationSort] = useState('newest');

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

  useEffect(() => {
    const t = setTimeout(() => {
      setOrderSearchQuery(orderSearchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [orderSearchInput]);

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
      if (productCategoryFilter) params.set('category', productCategoryFilter);
      if (productSearchQuery) params.set('search', productSearchQuery);
      const res = await axios.get(`/api/products/admin/all?${params.toString()}`);
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
    }
  }, [vendorFilter, productCategoryFilter, productSearchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter) params.set('status', orderStatusFilter);
      if (orderVendorFilter) params.set('vendor', orderVendorFilter);
      if (orderSort) params.set('sort', orderSort);
      if (orderSearchQuery) params.set('search', orderSearchQuery);
      if (orderDateFrom) params.set('from', orderDateFrom);
      if (orderDateTo) params.set('to', orderDateTo);
      const res = await axios.get(`/api/orders/admin/all?${params.toString()}`);
      setOrders(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    }
  }, [orderStatusFilter, orderVendorFilter, orderSort, orderSearchQuery, orderDateFrom, orderDateTo]);

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

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get('/api/reviews/admin');
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
      await Promise.all([fetchProducts(), fetchOrders(), fetchVendors(), fetchUsers(), fetchReviews()]);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProducts, fetchOrders, fetchVendors, fetchUsers, fetchReviews]);

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

  const openAddUser = () => {
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPassword('');
    setUserFormNewPassword('');
    setUserFormRole('customer');
    setUserFormError('');
    setUserFormOpen(true);
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserFormName(u.name || '');
    setUserFormEmail(u.email || '');
    setUserFormPassword('');
    setUserFormNewPassword('');
    setUserFormRole(u.role || 'customer');
    setUserFormError('');
    setUserFormOpen(true);
  };

  const closeUserForm = () => {
    setUserFormOpen(false);
    setEditingUser(null);
    setUserFormError('');
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormLoading(true);
    try {
      if (editingUser) {
        const payload = { name: userFormName.trim(), email: userFormEmail.trim(), role: userFormRole };
        if (userFormNewPassword.trim()) payload.newPassword = userFormNewPassword.trim();
        await axios.put(`/api/users/${editingUser._id}`, payload);
      } else {
        if (!userFormPassword.trim()) {
          setUserFormError('Password is required for new users.');
          setUserFormLoading(false);
          return;
        }
        await axios.post('/api/users', {
          name: userFormName.trim(),
          email: userFormEmail.trim(),
          password: userFormPassword.trim(),
          role: userFormRole
        });
      }
      closeUserForm();
      fetchUsers();
    } catch (err) {
      setUserFormError(err.response?.data?.message || (editingUser ? 'Update failed.' : 'Create failed.'));
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u._id === user?.id) return;
    if (!window.confirm(`Delete user "${u.name || u.email}"? This cannot be undone.`)) return;
    setDeletingUserId(u._id);
    setError('');
    try {
      await axios.delete(`/api/users/${u._id}`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const openReviewEdit = (r) => {
    setReviewEditId(r._id);
    setReviewEditRating(r.rating);
    setReviewEditComment(r.comment || '');
    setReviewEditError('');
  };

  const closeReviewEdit = () => {
    setReviewEditId(null);
    setReviewEditRating(5);
    setReviewEditComment('');
    setReviewEditError('');
  };

  const handleReviewEditSave = async (e) => {
    e.preventDefault();
    const r = reviews.find((x) => x._id === reviewEditId);
    if (!r?.product?._id) return;
    setReviewEditSaving(true);
    setReviewEditError('');
    try {
      await axios.put(`/api/products/${r.product._id}/reviews/${reviewEditId}`, {
        rating: reviewEditRating,
        comment: reviewEditComment
      });
      closeReviewEdit();
      await fetchReviews();
    } catch (err) {
      setReviewEditError(err.response?.data?.message || 'Failed to update review.');
    } finally {
      setReviewEditSaving(false);
    }
  };

  const handleDeleteReview = async (r) => {
    if (!window.confirm('Remove this review? This cannot be undone.')) return;
    const productId = r.product?._id || r.product;
    if (!productId) return;
    setDeletingReviewId(r._id);
    try {
      await axios.delete(`/api/products/${productId}/reviews/${r._id}`);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeletingReviewId(null);
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
                  <span className="vendor-sidebar-label">{label}</span>
                  {((id === 'notifications' || id === 'orders') && adminStats.pendingOrders > 0) && (
                    <span className="vendor-sidebar-notification-badge" aria-label={`${adminStats.pendingOrders} pending`}>
                      {adminStats.pendingOrders > 99 ? '99+' : adminStats.pendingOrders}
                    </span>
                  )}
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
              <div className="vendor-notifications-page">
                <div className="vendor-content-header">
                  <h1 className="vendor-dashboard-title">Notifications</h1>
                  <p className="vendor-dashboard-greeting">New order and status alerts. Process orders from Order Management.</p>
                </div>
                <div className="vendor-notifications-toolbar">
                  <label htmlFor="admin-notification-sort" className="vendor-filter-label">Sort:</label>
                  <select
                    id="admin-notification-sort"
                    className="vendor-filter-select"
                    value={notificationSort}
                    onChange={(e) => setNotificationSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                  {orders.length > 0 && (
                    <span className="vendor-notifications-count">{orders.length} notification{orders.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {orders.length === 0 ? (
                  <p className="vendor-empty-text">No notifications yet. New orders and updates will appear here.</p>
                ) : (
                  <ul className="vendor-notification-list vendor-notification-list-full">
                    {(notificationSort === 'newest' ? [...orders] : [...orders].reverse()).map((order) => (
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
                <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
              </div>
            ) : (
              <>
                <div className="vendor-content-header">
                  <h1 className="vendor-dashboard-title">
                    {activeTab === 'products' ? 'All Products' : activeTab === 'orders' ? 'Order Management' : activeTab === 'reviews' ? 'Reviews & Ratings' : 'User Management'}
                  </h1>
                  <p className="vendor-dashboard-greeting">Hello, {displayName}</p>
                </div>
                <div className="vendor-stats vendor-stats-two">
                  <div className="vendor-stat-card">
                    <span className="vendor-stat-value">{activeTab === 'reviews' ? reviews.length : activeTab === 'users' ? users.length : products.length}</span>
                    <span className="vendor-stat-label">{activeTab === 'reviews' ? 'Reviews' : activeTab === 'users' ? 'Users' : 'Products'}</span>
                  </div>
                  <div className="vendor-stat-card">
                    <span className="vendor-stat-value">{activeTab === 'reviews' ? '—' : activeTab === 'users' ? users.filter((u) => u.isBlocked).length : orders.length}</span>
                    <span className="vendor-stat-label">{activeTab === 'reviews' ? 'Edit / Delete below' : activeTab === 'users' ? 'Blocked' : 'Orders'}</span>
                  </div>
                </div>
                <div className="vendor-dashboard-content">
                  {activeTab === 'products' && (
                    <div className="vendor-products-section">
                      <div className="vendor-products-header">
                        <h2 className="vendor-products-heading">All Products</h2>
                        <p className="vendor-products-subtitle">Manage product listings on the platform</p>
                        <button type="button" className="vendor-products-add-btn" onClick={openAddProduct}>
                          <span className="vendor-products-add-icon" aria-hidden>+</span> Add Product
                        </button>
                      </div>
                      <div className="vendor-products-filters">
                        <label htmlFor="admin-vendor-filter" className="vendor-filter-label">Vendor:</label>
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
                        <label htmlFor="admin-product-category" className="vendor-filter-label">Category:</label>
                        <select
                          id="admin-product-category"
                          className="vendor-filter-select"
                          value={productCategoryFilter}
                          onChange={(e) => setProductCategoryFilter(e.target.value)}
                        >
                          <option value="">All categories</option>
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <label htmlFor="admin-product-search" className="vendor-filter-label">Search:</label>
                        <input
                          id="admin-product-search"
                          type="search"
                          className="vendor-search-input"
                          placeholder="Name or description..."
                          value={productSearchInput}
                          onChange={(e) => setProductSearchInput(e.target.value)}
                          aria-label="Search products by name or description"
                        />
                        {(productSearchInput || vendorFilter || productCategoryFilter) && (
                          <button
                            type="button"
                            className="vendor-search-clear"
                            onClick={() => { setProductSearchInput(''); setVendorFilter(''); setProductCategoryFilter(''); }}
                            aria-label="Clear filters"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {products.length === 0 ? (
                        <p className="vendor-dashboard-overview-text">No products on the platform yet.</p>
                      ) : (
                        <div className="vendor-orders-table-wrap">
                          <table className="vendor-orders-table vendor-products-table">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Vendor</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map((p) => (
                                <tr key={p._id}>
                                  <td className="vendor-products-table-product">
                                    <span className="vendor-products-table-name">{p.name}</span>
                                    {p.description && (
                                      <span className="vendor-products-table-desc">
                                        {p.description.length > 60 ? `${p.description.slice(0, 60)}...` : p.description}
                                      </span>
                                    )}
                                  </td>
                                  <td>{CATEGORY_LABELS[p.category] || p.category}</td>
                                  <td className="vendor-products-table-price">{formatPrice(p.price)}</td>
                                  <td>{p.stock ?? 0} units</td>
                                  <td>
                                    <span className={`vendor-products-status vendor-products-status-${(p.stock ?? 0) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                      {(p.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                  </td>
                                  <td className="vendor-products-table-vendor">
                                    {p.vendor && (typeof p.vendor === 'object' ? (p.vendor.name || p.vendor.email) : '—')}
                                  </td>
                                  <td className="vendor-products-table-actions">
                                    <button
                                      type="button"
                                      className="vendor-products-action-btn vendor-products-action-edit"
                                      onClick={() => openEditProduct(p)}
                                      disabled={productFormOpen}
                                      aria-label="Edit"
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="vendor-products-action-btn vendor-products-action-delete"
                                      onClick={() => handleDeleteProduct(p)}
                                      disabled={deletingProductId !== null}
                                      aria-label="Delete"
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
                  {activeTab === 'reviews' && (
                    <div className="vendor-orders-section">
                      <h2 className="vendor-orders-heading">All reviews — add, edit, or remove</h2>
                      {reviews.length === 0 ? (
                        <p className="vendor-empty-text">No reviews on the platform yet.</p>
                      ) : (
                        <div className="vendor-orders-table-wrap">
                          <table className="vendor-orders-table admin-reviews-table">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Customer</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Date</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reviews.map((r) => (
                                <tr key={r._id}>
                                  <td>{r.product?.name || '—'}</td>
                                  <td>
                                    <span className="admin-review-customer-name">{r.user?.name || '—'}</span>
                                    {r.user?.email && <span className="admin-review-customer-email">{r.user.email}</span>}
                                  </td>
                                  <td>{r.rating}/5</td>
                                  <td className="vendor-review-comment-cell">{r.comment || '—'}</td>
                                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="vendor-btn vendor-btn-secondary vendor-btn-sm"
                                      onClick={() => openReviewEdit(r)}
                                      disabled={reviewEditId != null}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="vendor-btn vendor-btn-danger vendor-btn-sm"
                                      onClick={() => handleDeleteReview(r)}
                                      disabled={deletingReviewId !== null}
                                    >
                                      {deletingReviewId === r._id ? 'Deleting…' : 'Delete'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {reviewEditId && (
                        <div
                          className="vendor-modal-backdrop"
                          onClick={closeReviewEdit}
                          role="presentation"
                        >
                          <div
                            className="vendor-modal"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-review-edit-title"
                          >
                            <div className="vendor-modal-header">
                              <h2 id="admin-review-edit-title" className="vendor-modal-title">Edit review</h2>
                              <button type="button" className="vendor-modal-close" onClick={closeReviewEdit} aria-label="Close">×</button>
                            </div>
                            <form onSubmit={handleReviewEditSave}>
                              {reviewEditError && <p className="vendor-dashboard-error" style={{ marginBottom: 12 }}>{reviewEditError}</p>}
                              <div className="vendor-product-form-group" style={{ marginBottom: 12 }}>
                                <label htmlFor="admin-review-rating">Rating (1–5)</label>
                                <select
                                  id="admin-review-rating"
                                  className="vendor-filter-select"
                                  value={reviewEditRating}
                                  onChange={(e) => setReviewEditRating(Number(e.target.value))}
                                  required
                                >
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="vendor-product-form-group" style={{ marginBottom: 16 }}>
                                <label htmlFor="admin-review-comment">Comment</label>
                                <textarea
                                  id="admin-review-comment"
                                  className="vendor-search-input"
                                  rows={3}
                                  maxLength={2000}
                                  value={reviewEditComment}
                                  onChange={(e) => setReviewEditComment(e.target.value)}
                                  placeholder="Optional comment"
                                />
                              </div>
                              <div className="vendor-modal-actions">
                                <button type="button" className="vendor-btn vendor-btn-secondary" onClick={closeReviewEdit}>Cancel</button>
                                <button type="submit" className="vendor-btn vendor-btn-primary" disabled={reviewEditSaving}>
                                  {reviewEditSaving ? 'Saving…' : 'Save'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                      <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                    </div>
                  )}
                  {activeTab === 'users' && (
                    <div className="vendor-orders-section">
                      <div className="vendor-products-header">
                        <h2 className="vendor-orders-heading">All users</h2>
                        <button type="button" className="vendor-btn vendor-btn-primary" onClick={openAddUser}>
                          Add User
                        </button>
                      </div>
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
                                    <div className="admin-user-actions">
                                      <button
                                        type="button"
                                        className="vendor-btn vendor-btn-secondary"
                                        onClick={() => openEditUser(u)}
                                        disabled={userFormOpen}
                                      >
                                        Edit
                                      </button>
                                      {u._id === user?.id ? (
                                        <span className="vendor-order-updating">(You)</span>
                                      ) : updatingUserId === u._id ? (
                                        <span className="vendor-order-updating">…</span>
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
                                      {u._id !== user?.id && (
                                        <button
                                          type="button"
                                          className="vendor-btn vendor-btn-danger"
                                          onClick={() => handleDeleteUser(u)}
                                          disabled={deletingUserId !== null}
                                        >
                                          {deletingUserId === u._id ? 'Deleting…' : 'Delete'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {userFormOpen && (
                        <div className="vendor-modal-backdrop" onClick={closeUserForm} role="presentation">
                          <div className="vendor-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="admin-user-form-title">
                            <div className="vendor-modal-header">
                              <h2 id="admin-user-form-title" className="vendor-modal-title">
                                {editingUser ? 'Edit user' : 'Add user'}
                              </h2>
                              <button type="button" className="vendor-modal-close" onClick={closeUserForm} aria-label="Close">×</button>
                            </div>
                            <p className="vendor-modal-desc">
                              {editingUser ? 'Update name, email, role, or set a new password (leave blank to keep current).' : 'Create a new user. Password must have 8+ chars, upper, lower, number, special character.'}
                            </p>
                            <form onSubmit={handleUserFormSubmit} className="admin-user-form" style={{ padding: '20px 24px 24px' }}>
                              {userFormError && <div className="vendor-dashboard-error" role="alert" style={{ marginBottom: 16 }}>{userFormError}</div>}
                              <div className="vendor-product-form-group" style={{ marginBottom: 16 }}>
                                <label htmlFor="admin-user-form-name">Name *</label>
                                <input
                                  id="admin-user-form-name"
                                  type="text"
                                  className="vendor-search-input"
                                  value={userFormName}
                                  onChange={(e) => setUserFormName(e.target.value)}
                                  required
                                  minLength={2}
                                  placeholder="Full name"
                                />
                              </div>
                              <div className="vendor-product-form-group" style={{ marginBottom: 16 }}>
                                <label htmlFor="admin-user-form-email">Email *</label>
                                <input
                                  id="admin-user-form-email"
                                  type="email"
                                  className="vendor-search-input"
                                  value={userFormEmail}
                                  onChange={(e) => setUserFormEmail(e.target.value)}
                                  required
                                  placeholder="email@example.com"
                                />
                              </div>
                              {!editingUser ? (
                                <div className="vendor-product-form-group" style={{ marginBottom: 16 }}>
                                  <label htmlFor="admin-user-form-password">Password *</label>
                                  <input
                                    id="admin-user-form-password"
                                    type="password"
                                    className="vendor-search-input"
                                    value={userFormPassword}
                                    onChange={(e) => setUserFormPassword(e.target.value)}
                                    required={!editingUser}
                                    placeholder="Min 8 chars, upper, lower, number, special"
                                  />
                                </div>
                              ) : (
                                <div className="vendor-product-form-group" style={{ marginBottom: 16 }}>
                                  <label htmlFor="admin-user-form-newpassword">New password (optional)</label>
                                  <input
                                    id="admin-user-form-newpassword"
                                    type="password"
                                    className="vendor-search-input"
                                    value={userFormNewPassword}
                                    onChange={(e) => setUserFormNewPassword(e.target.value)}
                                    placeholder="Leave blank to keep current"
                                  />
                                </div>
                              )}
                              <div className="vendor-product-form-group" style={{ marginBottom: 20 }}>
                                <label htmlFor="admin-user-form-role">Role *</label>
                                <select
                                  id="admin-user-form-role"
                                  className="vendor-filter-select"
                                  value={userFormRole}
                                  onChange={(e) => setUserFormRole(e.target.value)}
                                  required
                                  disabled={editingUser?._id === user?.id}
                                >
                                  <option value="customer">customer</option>
                                  <option value="vendor">vendor</option>
                                  <option value="admin">admin</option>
                                </select>
                                {editingUser && editingUser._id === user?.id && (
                                  <p className="vendor-product-form-hint" style={{ marginTop: 4 }}>You cannot change your own role.</p>
                                )}
                              </div>
                              <div className="vendor-product-form-actions" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button type="button" className="vendor-product-form-btn vendor-product-form-btn-cancel" onClick={closeUserForm}>Cancel</button>
                                <button type="submit" className="vendor-product-form-btn vendor-product-form-btn-submit" disabled={userFormLoading}>
                                  {userFormLoading ? 'Saving…' : (editingUser ? 'Update' : 'Create')}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                      <Link to="/products" className="vendor-dashboard-back">← Back to Shop</Link>
                    </div>
                  )}
                  {activeTab === 'orders' && (
                    <div className="vendor-orders-section">
                      <h2 className="vendor-orders-heading">All orders on the platform</h2>
                      <div className="vendor-products-filters">
                        <label htmlFor="admin-order-status" className="vendor-filter-label">Status:</label>
                        <select
                          id="admin-order-status"
                          className="vendor-filter-select"
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                        >
                          <option value="">All statuses</option>
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <label htmlFor="admin-order-vendor" className="vendor-filter-label">Vendor:</label>
                        <select
                          id="admin-order-vendor"
                          className="vendor-filter-select"
                          value={orderVendorFilter}
                          onChange={(e) => setOrderVendorFilter(e.target.value)}
                        >
                          <option value="">All vendors</option>
                          {vendors.map((v) => (
                            <option key={v._id} value={v._id}>{v.name || v.email || v._id}</option>
                          ))}
                        </select>
                        <label htmlFor="admin-order-sort" className="vendor-filter-label">Sort:</label>
                        <select
                          id="admin-order-sort"
                          className="vendor-filter-select"
                          value={orderSort}
                          onChange={(e) => setOrderSort(e.target.value)}
                        >
                          <option value="dateDesc">Newest first</option>
                          <option value="dateAsc">Oldest first</option>
                          <option value="totalDesc">Total (high → low)</option>
                          <option value="totalAsc">Total (low → high)</option>
                          <option value="status">Status (A–Z)</option>
                        </select>
                        <label htmlFor="admin-order-search" className="vendor-filter-label">Customer:</label>
                        <input
                          id="admin-order-search"
                          type="search"
                          className="vendor-search-input"
                          placeholder="Name or email..."
                          value={orderSearchInput}
                          onChange={(e) => setOrderSearchInput(e.target.value)}
                          aria-label="Search orders by customer name or email"
                        />
                        <label htmlFor="admin-order-date-from" className="vendor-filter-label">From:</label>
                        <input
                          id="admin-order-date-from"
                          type="date"
                          className="vendor-filter-date"
                          value={orderDateFrom}
                          onChange={(e) => setOrderDateFrom(e.target.value)}
                          aria-label="Orders from date"
                        />
                        <label htmlFor="admin-order-date-to" className="vendor-filter-label">To:</label>
                        <input
                          id="admin-order-date-to"
                          type="date"
                          className="vendor-filter-date"
                          value={orderDateTo}
                          onChange={(e) => setOrderDateTo(e.target.value)}
                          aria-label="Orders to date"
                        />
                        {(orderSearchInput || orderStatusFilter || orderVendorFilter || orderDateFrom || orderDateTo) && (
                          <button
                            type="button"
                            className="vendor-search-clear"
                            onClick={() => {
                              setOrderSearchInput('');
                              setOrderStatusFilter('');
                              setOrderVendorFilter('');
                              setOrderDateFrom('');
                              setOrderDateTo('');
                            }}
                            aria-label="Clear filters"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          className="vendor-export-csv-btn"
                          onClick={() => exportOrdersToCsv(orders, formatPrice)}
                          disabled={orders.length === 0}
                          aria-label="Export orders to CSV"
                        >
                          Export to CSV
                        </button>
                      </div>
                      {orders.length === 0 ? (
                        <p className="vendor-dashboard-overview-text">No orders match your filters.</p>
                      ) : (
                        <div className="vendor-orders-table-wrap">
                          <table className="vendor-orders-table admin-orders-table">
                            <thead>
                              <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Vendors</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((order) => {
                                const vendorNames = [...new Set((order.items || [])
                                  .map((i) => i.product?.vendor?.name || i.product?.vendor?.email || '—')
                                  .filter(Boolean))];
                                const vendorList = vendorNames.length ? vendorNames.join(', ') : '—';
                                return (
                                  <tr key={order._id}>
                                    <td>#{order._id.slice(-6).toUpperCase()}</td>
                                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + new Date(order.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' }) : '—'}</td>
                                    <td>
                                      <span className="admin-order-customer-name">{order.user?.name || '—'}</span>
                                      <br />
                                      <span className="admin-order-customer-email">{order.user?.email || '—'}</span>
                                    </td>
                                    <td className="admin-order-vendors-cell">{vendorList}</td>
                                    <td>
                                      <ul className="admin-order-items-inline">
                                        {(order.items || []).slice(0, 3).map((item, idx) => (
                                          <li key={idx}>{item.product?.name} × {item.quantity}</li>
                                        ))}
                                        {(order.items || []).length > 3 && (
                                          <li>+{(order.items || []).length - 3} more</li>
                                        )}
                                      </ul>
                                    </td>
                                    <td>{formatPrice(order.totalAmount || 0)}</td>
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
                                );
                              })}
                            </tbody>
                          </table>
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
